
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { deal, findStartingPlayer, canPlay, isTranque, calculateHandPoints, type Tile } from './src/lib/gameEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create_room', (settings) => {
      const roomId = Math.random().toString(36).substring(7);
      rooms.set(roomId, {
        id: roomId,
        players: [],
        gameState: null,
        status: 'waiting',
        settings: settings || {
          maxPoints: 100,
          playersCount: 4,
          mode: 'individual',
        },
      });
      socket.emit('room_created', roomId);
    });

    socket.on('join_room', ({ roomId, playerName }) => {
      socket.join(roomId);
      
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          players: [],
          gameState: null,
          status: 'waiting',
          settings: {
            maxPoints: 100,
            playersCount: 4,
            mode: 'individual',
          },
        });
      }

      const room = rooms.get(roomId);
      
      // Check if player already in room
      const existingPlayer = room.players.find(p => p.id === socket.id);
      if (!existingPlayer && room.players.length < (room.settings?.playersCount || 4)) {
        room.players.push({
          id: socket.id,
          name: playerName,
          hand: [],
          isReady: false,
          score: 0,
        });
      }

      io.to(roomId).emit('room_update', room);
    });

    socket.on('start_game', (roomId) => {
      const room = rooms.get(roomId);
      if (!room || room.players.length < 2) return;

      room.lastWinnerIndex = -1; // Reset for new game
      startRound(room);
      io.to(roomId).emit('game_started', room);
    });

    socket.on('add_bot', (roomId) => {
      const room = rooms.get(roomId);
      const playersCount = room.settings?.playersCount || 4;
      if (!room || room.players.length >= playersCount) return;

      const botId = `bot_${Math.random().toString(36).substring(7)}`;
      room.players.push({
        id: botId,
        name: `Bot ${room.players.length + 1}`,
        hand: [],
        isReady: true,
        isBot: true,
        score: 0,
      });

      io.to(roomId).emit('room_update', room);
    });

    socket.on('play_tile', ({ roomId, tile, side }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') return;

      handlePlay(room, socket.id, tile, side);
    });

    socket.on('send_chat', ({ roomId, sender, text }) => {
      io.to(roomId).emit('chat_message', { sender, text });
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      const room = rooms.get(roomId);
      if (room) {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit('room_update', room);
          }
        }
      }
    });

    socket.on('confirm_round', (roomId) => {
      const room = rooms.get(roomId);
      if (!room || !room.gameState || room.gameState.roundWinnerId === undefined) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.confirmedRound = true;
      }

      // Check if all HUMAN players confirmed
      const humanPlayers = room.players.filter(p => !p.isBot);
      const allConfirmed = humanPlayers.every(p => p.confirmedRound);

      if (allConfirmed) {
        // Reset confirmation for next round
        room.players.forEach(p => p.confirmedRound = false);
        
        if (room.status === 'playing') {
          startRound(room);
          io.to(roomId).emit('room_update', room);
        }
      } else {
        io.to(roomId).emit('room_update', room);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // Handle player removal from rooms
      rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit('room_update', room);
          }
        }
      });
    });
  });

  function handlePlay(room, playerId, tile, side) {
    const { gameState, players } = room;
    const currentPlayer = players[gameState.turnIndex];
    
    if (!currentPlayer || currentPlayer.id !== playerId) return;

    // Validate move
    const playSide = canPlay(tile, gameState.board);
    if (!playSide) return;

    // Enforce starting with double six if it's the first move
    if (gameState.board.length === 0) {
      const hasDoubleSix = currentPlayer.hand.some(t => t[0] === 6 && t[1] === 6);
      if (hasDoubleSix && (tile[0] !== 6 || tile[1] !== 6)) return;
    }

    // Strict side validation
    let actualSide = side;
    if (gameState.board.length === 0) {
      actualSide = 'right';
    } else if (playSide !== 'both') {
      actualSide = playSide;
    } else {
      actualSide = (side === 'left' || side === 'right') ? side : 'right';
    }

    // Update board
    let finalTile: Tile;
    if (gameState.board.length === 0) {
      finalTile = tile;
      gameState.board.push(finalTile);
    } else if (actualSide === 'left') {
      const leftVal = gameState.board[0][0];
      finalTile = tile[1] === leftVal ? [tile[0], tile[1]] : [tile[1], tile[0]];
      gameState.board.unshift(finalTile);
      gameState.pivotIndex++;
    } else {
      const rightVal = gameState.board[gameState.board.length - 1][1];
      finalTile = tile[0] === rightVal ? [tile[0], tile[1]] : [tile[1], tile[0]];
      gameState.board.push(finalTile);
    }

    // Remove from hand
    const tileIndex = currentPlayer.hand.findIndex(t => 
      (t[0] === tile[0] && t[1] === tile[1]) || (t[0] === tile[1] && t[1] === tile[0])
    );
    if (tileIndex !== -1) {
      currentPlayer.hand.splice(tileIndex, 1);
    }

    // Check win
    if (currentPlayer.hand.length === 0) {
      const isCapicua = playSide === 'both' && tile[0] !== tile[1];
      handleEndRound(room, currentPlayer.id, isCapicua);
      return;
    }

    // Check tranque
    if (isTranque(gameState.board, players.map(p => p.hand))) {
      let roundWinnerId;
      
      if (room.settings.mode === 'pairs' && players.length === 4) {
        // Pairs: Sum team points
        const teamAPoints = calculateHandPoints(players[0].hand) + calculateHandPoints(players[2].hand);
        const teamBPoints = calculateHandPoints(players[1].hand) + calculateHandPoints(players[3].hand);
        
        if (teamAPoints <= teamBPoints) {
          // If Team A wins (or tie, usually goes to who blocked or least points individual)
          // For simplicity, we choose the individual with fewer points in Team A
          const p0p = calculateHandPoints(players[0].hand);
          const p2p = calculateHandPoints(players[2].hand);
          roundWinnerId = p0p <= p2p ? players[0].id : players[2].id;
        } else {
          // Team B wins
          const p1p = calculateHandPoints(players[1].hand);
          const p3p = calculateHandPoints(players[3].hand);
          roundWinnerId = p1p <= p3p ? players[1].id : players[3].id;
        }
      } else {
        // Individual
        const scores = players.map(p => ({ id: p.id, points: calculateHandPoints(p.hand) }));
        scores.sort((a, b) => a.points - b.points);
        roundWinnerId = scores[0].id;
      }
      
      room.gameState.tranque = true;
      handleEndRound(room, roundWinnerId);
      return;
    }

    // Next turn
    gameState.turnIndex = (gameState.turnIndex + 1) % players.length;
    
    // Skip players who can't play
    let skipCount = 0;
    while (!canPlayAny(players[gameState.turnIndex].hand, gameState.board) && skipCount < players.length) {
      gameState.turnIndex = (gameState.turnIndex + 1) % players.length;
      skipCount++;
    }

    // Dominican rule: if a player makes everyone else pass (skipCount = 3 for 4 players)
    // they get a 30 points bonus immediately.
    if (skipCount > 0 && skipCount === players.length - 1) {
      const bonus = 30;
      if (room.settings.mode === 'pairs') {
        const teamIndex = gameState.turnIndex % 2;
        players.forEach((p, i) => {
          if (i % 2 === teamIndex) {
            p.score += bonus;
          }
        });
      } else {
        currentPlayer.score += bonus;
      }
      
      io.to(room.id).emit('chat_message', { 
        sender: 'SISTEMA', 
        text: `¡${currentPlayer.name} pasó a los ${skipCount}! +${bonus} pts` 
      });

      // Check if this bonus ends the game
      const gameWinner = players.find(p => p.score >= room.settings.maxPoints);
      if (gameWinner) {
        room.status = 'ended';
        room.winner = gameWinner.id;
        if (room.settings.mode === 'pairs') {
          room.winningTeam = players.indexOf(gameWinner) % 2;
        }
        io.to(room.id).emit('game_ended', room);
        return;
      }
    }

    io.to(room.id).emit('room_update', room);

    // Bot move logic
    const nextPlayer = players[gameState.turnIndex];
    if (nextPlayer && nextPlayer.isBot && room.status === 'playing') {
      setTimeout(() => {
        const botMove = getBotMove(nextPlayer.hand, gameState.board);
        if (botMove) {
          handlePlay(room, nextPlayer.id, botMove.tile, botMove.side);
        }
      }, 1500);
    }
  }

  function startRound(room) {
    const hands = deal(room.players.length);
    room.players.forEach((p, i) => {
      p.hand = hands[i];
    });

    room.status = 'playing';
    
    let turnIndex;
    if (room.lastWinnerIndex !== undefined && room.lastWinnerIndex !== -1) {
      turnIndex = room.lastWinnerIndex;
    } else {
      turnIndex = findStartingPlayer(hands);
    }

    room.gameState = {
      board: [],
      pivotIndex: 0,
      turnIndex: turnIndex,
      history: [],
      tranque: false,
      isCapicua: false,
    };

    // Trigger bot if it's their turn
    const firstPlayer = room.players[room.gameState.turnIndex];
    if (firstPlayer.isBot) {
      setTimeout(() => {
        const botMove = getBotMove(firstPlayer.hand, room.gameState.board);
        if (botMove) {
          handlePlay(room, firstPlayer.id, botMove.tile, botMove.side);
        }
      }, 1500);
    }
  }

  function handleEndRound(room, roundWinnerId, isCapicua = false) {
    const { players, settings } = room;
    const winnerIndex = players.findIndex(p => p.id === roundWinnerId);
    
    // Calculate points: Winner gets the sum of ALL tiles remaining on the table
    let roundPoints = 0;
    players.forEach(p => {
      roundPoints += calculateHandPoints(p.hand);
    });

    // Add Capicua bonus if applicable
    if (isCapicua) {
      roundPoints += 30;
    }

    if (settings.mode === 'pairs') {
      const teamIndex = winnerIndex % 2;
      // Update scores for both players in the winning team
      players.forEach((p, i) => {
        if (i % 2 === teamIndex) {
          p.score += roundPoints;
        }
      });
    } else {
      // Individual: winner gets the points
      players[winnerIndex].score += roundPoints;
    }

    room.gameState.roundWinnerId = roundWinnerId;
    room.gameState.roundPoints = roundPoints;
    room.gameState.isCapicua = isCapicua;
    room.lastWinnerIndex = winnerIndex;

    // Reset confirmations
    players.forEach(p => p.confirmedRound = false);

    // Check game win
    const gameWinner = players.find(p => p.score >= settings.maxPoints);
    if (gameWinner) {
      room.status = 'ended';
      room.winner = gameWinner.id;
      if (settings.mode === 'pairs') {
        const winTeam = players.indexOf(gameWinner) % 2;
        room.winningTeam = winTeam;
      }
      io.to(room.id).emit('game_ended', room);
    } else {
      // Notify about round end, but DON'T start automatically
      io.to(room.id).emit('room_update', room);
    }
  }

  function getBotMove(hand, board) {
    // If first move, prioritize double six
    if (board.length === 0) {
      const doubleSix = hand.find(t => t[0] === 6 && t[1] === 6);
      if (doubleSix) return { tile: doubleSix, side: 'right' };
    }

    const validMoves = [];
    hand.forEach(tile => {
      const side = canPlay(tile, board);
      if (side === 'both') {
        validMoves.push({ tile, side: 'right' });
      } else if (side) {
        validMoves.push({ tile, side });
      }
    });
    if (validMoves.length === 0) return null;
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  function canPlayAny(hand: [number, number][], board: [number, number][]) {
    if (board.length === 0) return true;
    return hand.some(tile => canPlay(tile, board));
  }

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();


import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Tile } from './Tile';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Info, Trophy, RotateCcw, Bot, LogOut, Play, Copy, Check, Hash, MessageSquare, LayoutDashboard } from 'lucide-react';
import { canPlay } from '../lib/gameEngine';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { Chat } from './Chat';

export const GameTable: React.FC = () => {
  const { room, gameState, socket, playTile, startGame, addBot, leaveRoom, confirmRound } = useGameStore();

  const [pendingTile, setPendingTile] = useState<[number, number] | null>(null);
  const [copied, setCopied] = useState(false);
  const [showScoreMobile, setShowScoreMobile] = useState(false);
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const unitSize = isMobile ? 0.75 : 1.5;

  const copyRoomCode = () => {
    if (room?.id) {
      navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!room) return null;

  const currentPlayer = room.players.find(p => p.id === socket?.id);
  const myIndex = room.players.findIndex(p => p.id === socket?.id);
  const isMyTurn = gameState && room.players[gameState.turnIndex]?.id === socket?.id;
  const isRoundOver = !!gameState?.roundWinnerId;

  // Calculate relative positions for other players (Counter-clockwise)
  const getPlayerAtPosition = (pos: 'left' | 'top' | 'right') => {
    if (myIndex === -1) return null;
    const numPlayers = room.players.length;
    
    if (numPlayers === 2) {
      // User (Bottom) -> Opponent (Top)
      return pos === 'top' ? room.players[(myIndex + 1) % 2] : null;
    }
    
    if (numPlayers === 3) {
      // User (Bottom) -> Opponent 1 (Right) -> Opponent 2 (Left) -> User
      if (pos === 'right') return room.players[(myIndex + 1) % 3];
      if (pos === 'left') return room.players[(myIndex + 2) % 3];
      return null;
    }

    if (numPlayers === 4) {
      // User (Bottom) -> Opponent 1 (Right) -> Opponent 2 (Top) -> Opponent 3 (Left) -> User
      if (pos === 'right') return room.players[(myIndex + 1) % 4];
      if (pos === 'top') return room.players[(myIndex + 2) % 4];
      if (pos === 'left') return room.players[(myIndex + 3) % 4];
    }

    return null;
  };

  const PlayerSlot = ({ player, position }: { player: any; position: 'left' | 'top' | 'right' }) => {
    if (!player) return null;
    const isTurn = gameState && room.players[gameState.turnIndex]?.id === player.id;
    const playerIndex = room.players.findIndex(p => p.id === player.id);
    
    const containerClasses = {
      top: "absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex flex-col items-center z-20 scale-[0.55] sm:scale-75 origin-bottom",
      left: "absolute right-full top-1/2 -translate-y-1/2 mr-1 flex flex-col items-center z-20 scale-[0.55] sm:scale-75 origin-right",
      right: "absolute left-full top-1/2 -translate-y-1/2 ml-1 flex flex-col items-center z-20 scale-[0.55] sm:scale-75 origin-left",
    };

    const isWinner = gameState?.roundWinnerId === player.id;
    const isRoundOver = !!gameState?.roundWinnerId;
    const showHand = room.status === 'ended' || isRoundOver;

    return (
      <div className={containerClasses[position]}>
        <div className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-500",
          isTurn ? "bg-yellow-400/20 ring-2 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.2)]" : "bg-black/20 backdrop-blur-sm",
          isWinner && "ring-4 ring-green-500 bg-green-500/10 scale-105"
        )}>
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white text-xl font-bold border-2 border-white/20 shadow-xl">
              {player.name[0].toUpperCase()}
            </div>
            {isTurn && (
              <motion.div 
                layoutId="turn-indicator"
                className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-gray-900"
              >
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse" />
              </motion.div>
            )}
            {isWinner && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-gray-900">
                <Trophy size={12} className="text-white" />
              </div>
            )}
          </div>
          
          <div className="text-center">
            <div className="text-white text-[10px] sm:text-base font-black tracking-wide drop-shadow-md uppercase truncate max-w-[60px] sm:max-w-none">{player.name}</div>
            <div className="flex flex-col gap-0.5 sm:gap-1 items-center mt-0.5 sm:mt-1">
              <div className="text-yellow-400 text-[7px] sm:text-xs font-bold bg-black/40 px-1.5 py-0.5 rounded-full inline-block">
                {player.hand.length} {player.hand.length === 1 ? 'FICHA' : 'FICHAS'}
              </div>
              <div className="text-white text-[7px] sm:text-[10px] font-bold bg-blue-500/40 px-1.5 py-0.5 rounded-full">
                {player.score} pts
              </div>
            </div>
          </div>

          <div className={cn("flex gap-1 mt-2", (position === 'left' || position === 'right') ? "flex-col" : "flex-row")}>
            {showHand ? (
              player.hand.map((tile: [number, number], idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.1, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Tile 
                    tile={tile} 
                    isVertical={position === 'top'} 
                    className={cn(
                      position === 'top' ? "w-10 h-20" : "w-20 h-10",
                      "scale-[0.6] sm:scale-100 origin-center"
                    )} 
                    disabled 
                  />
                </motion.div>
              ))
            ) : (
              Array.from({ length: player.hand.length }).map((_, i) => (
                <div key={i} className={cn(
                  "bg-gradient-to-br from-gray-100 to-gray-300 rounded-sm border border-white/60 shadow-lg",
                  (position === 'left' || position === 'right') ? "w-10 h-6 sm:w-12 sm:h-8" : "w-6 h-10 sm:w-8 sm:h-12"
                )} />
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const handlePlay = (tile: [number, number]) => {
    if (!isMyTurn || !gameState) return;
    
    // If it's the first play, don't ask, just play it in the center (right side by default in server)
    if (gameState.board.length === 0) {
      playTile(tile, 'right');
      return;
    }

    const side = canPlay(tile, gameState.board);
    if (side === 'both') {
      setPendingTile(tile);
    } else if (side) {
      playTile(tile, side);
    }
  };

  const confirmPlay = (side: 'left' | 'right') => {
    if (pendingTile) {
      playTile(pendingTile, side);
      setPendingTile(null);
    }
  };

  const RoundResultAlert = () => {
    if (!gameState?.roundWinnerId || room.status === 'ended') return null;
    
    const winner = room.players.find(p => p.id === gameState.roundWinnerId);
    if (!winner) return null;

    const me = room.players.find(p => p.id === socket?.id);
    const hasConfirmed = me?.confirmedRound;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-transparent pointer-events-none"
      >
        <div className="bg-black/50 backdrop-blur-sm p-3 sm:p-8 rounded-[25px] sm:rounded-[40px] border border-white/20 shadow-2xl text-center max-w-[min(60vw,220px)] sm:max-w-md w-full pointer-events-auto">
          <div className="mb-1.5 sm:mb-6 flex flex-col items-center">
            <div className="bg-yellow-400 p-1.5 sm:p-4 rounded-full mb-1.5 sm:mb-4 shadow-lg shadow-yellow-500/40">
              <Trophy className="text-gray-900 w-4 h-4 sm:w-12 sm:h-12" />
            </div>
            <h2 className="text-lg sm:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
              {gameState.tranque ? "¡TRANQUE!" : (gameState.isCapicua ? "¡CAPICÚA!" : "¡DOMINÓ!")}
            </h2>
            {gameState.isCapicua && (
              <span className="mt-0.5 bg-purple-500 text-white text-[6px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-bounce">
                Bono +30 pts
              </span>
            )}
          </div>
          
          <div className="space-y-0.5 sm:space-y-4">
            <div>
              <p className="text-xs sm:text-2xl text-yellow-400 font-bold uppercase tracking-widest truncate">{winner.name}</p>
              <div className="h-px w-full bg-white/10 my-1 sm:my-4" />
              <div className="flex flex-col items-center">
                <span className="text-[6px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Puntos Ganados</span>
                <span className="text-xl sm:text-6xl font-black text-white mt-0.5">+{gameState.roundPoints}</span>
              </div>
            </div>

            <button
              onClick={() => confirmRound()}
              disabled={hasConfirmed}
              className={cn(
                "w-full py-1.5 sm:py-4 rounded-lg sm:rounded-2xl font-black text-xs sm:text-xl uppercase tracking-tighter transition-all flex items-center justify-center gap-1.5 mt-3 sm:mt-8 pointer-events-auto",
                hasConfirmed 
                  ? "bg-gray-700 text-gray-500 cursor-default" 
                  : "bg-green-600 hover:bg-green-500 text-white shadow-[0_0_30px_rgba(22,163,74,0.4)] hover:scale-105 active:scale-95"
              )}
            >
              {hasConfirmed ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Esperando demás...
                </>
              ) : (
                <>
                  <Play size={24} fill="currentColor" />
                  Continuar
                </>
              )}
            </button>

            <div className="flex justify-center gap-1 mt-4">
              {room.players.filter(p => !p.isBot).map((p, i) => (
                <div 
                  key={p.id} 
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    p.confirmedRound ? "bg-green-500" : "bg-white/20"
                  )} 
                  title={p.name}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const MainScoreboard = () => {
    return (
      <div className={cn(
        "bg-black/80 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl min-w-[200px] flex flex-col gap-4 transition-all duration-300",
        "lg:absolute lg:top-20 lg:left-4 lg:z-30 lg:bg-black/60",
        showScoreMobile ? "fixed inset-x-4 top-24 z-[70] block" : "hidden lg:flex"
      )}>
        {/* Team Scores (if applicable) */}
        {room.settings?.mode === 'pairs' && room.players.length === 4 && (
          <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl min-w-[180px]">
            <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.2em] mb-3 border-b border-white/10 pb-2">Guerra de Parejas</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-white text-[10px] font-bold">Equipo A</span>
                  <span className="text-[9px] text-gray-400">Jug 1 & 3</span>
                </div>
                <span className="text-2xl font-black text-yellow-400">{room.players[0].score}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-white text-[10px] font-bold">Equipo B</span>
                  <span className="text-[9px] text-gray-400">Jug 2 & 4</span>
                </div>
                <span className="text-2xl font-black text-blue-400">{room.players[1].score}</span>
              </div>
            </div>
          </div>
        )}

        {/* Individual Leaderboard */}
        <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl min-w-[180px]">
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-3 border-b border-white/10 pb-2">Tabla de Puntos</div>
          <div className="space-y-3">
            {room.players.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    room.players[gameState?.turnIndex || 0]?.id === p.id ? "bg-yellow-400 animate-pulse" : "bg-white/20"
                  )} />
                  <span className={cn(
                    "text-xs font-bold truncate max-w-[80px]",
                    p.id === socket?.id ? "text-green-400" : "text-white"
                  )}>
                    {p.name}
                  </span>
                </div>
                <span className="text-sm font-black text-white">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-emerald-900 overflow-hidden relative">
      <MainScoreboard />
      
      <AnimatePresence>
        {showChatMobile && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed inset-0 z-[80] lg:hidden"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowChatMobile(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-[85%] bg-emerald-950 shadow-2xl">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                <span className="font-black text-white uppercase tracking-widest text-sm">Chat en vivo</span>
                <button onClick={() => setShowChatMobile(false)} className="text-white hover:text-red-400 p-2">
                  <LogOut size={20} />
                </button>
              </div>
              <div className="h-[calc(100%-60px)]">
                <Chat />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScoreMobile && <div className="fixed inset-0 z-[65] bg-black/60 lg:hidden" onClick={() => setShowScoreMobile(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        <RoundResultAlert key={gameState?.roundWinnerId || 'no-round'} />
      </AnimatePresence>
      
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col relative h-full">
        {/* Header */}
        <div className="p-2 sm:p-4 flex justify-between items-center bg-black/20 text-white z-50">
          <div className="flex items-center gap-1.5 sm:gap-4 overflow-x-auto no-scrollbar max-w-[60vw]">
            <div className="flex-shrink-0 flex items-center gap-1 sm:gap-3 bg-black/40 px-2 py-1 sm:px-4 sm:py-1.5 rounded-full border border-white/10">
              <Trophy size={14} className="text-yellow-500" />
              <div className="flex flex-col">
                <span className="text-xs font-black text-white">{room.settings?.maxPoints || 100}<span className="hidden xs:inline"> pts</span></span>
              </div>
            </div>
            
            {/* Room Code - More compact on mobile */}
            <div className="flex-shrink-0 flex items-center gap-1.5 bg-black/40 pl-2 pr-1 py-0.5 sm:pl-4 sm:pr-1.5 sm:py-1 rounded-full border border-white/10 group">
              <Hash size={12} className="text-purple-400" />
              <span className="text-[10px] sm:text-xs font-mono font-black text-purple-200 select-all">{room.id}</span>
              <button 
                onClick={copyRoomCode}
                className={cn(
                  "ml-1 p-1 rounded-full transition-all flex items-center justify-center",
                  copied ? "bg-green-500 text-white" : "bg-white/10 hover:bg-white/20 text-gray-400"
                )}
              >
                {copied ? <Check size={10} /> : <Copy size={10} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4">
            {room.status === 'waiting' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={addBot}
                  disabled={room.players.length >= 4}
                  className={cn(
                    "bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-all",
                    room.players.length >= 4 && "opacity-50 cursor-not-allowed"
                  )}
                  title="Añadir Bot"
                >
                  <Bot size={18} />
                </button>
                <button
                  onClick={startGame}
                  disabled={room.players.length < 2}
                  className={cn(
                    "bg-yellow-500 hover:bg-yellow-600 text-black font-black px-3 py-1.5 rounded-full transition-all shadow-lg text-xs flex items-center gap-1",
                    room.players.length < 2 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Play size={14} fill="currentColor" />
                  <span>PLAY</span>
                </button>
              </div>
            )}
            
            <button
              onClick={() => setShowScoreMobile(!showScoreMobile)}
              className={cn(
                "lg:hidden p-2 rounded-full transition-all",
                showScoreMobile ? "bg-yellow-400 text-black" : "bg-white/10 text-white"
              )}
            >
              <LayoutDashboard size={18} />
            </button>
            <button
              onClick={() => setShowChatMobile(!showChatMobile)}
              className={cn(
                "lg:hidden p-2 rounded-full transition-all relative",
                showChatMobile ? "bg-blue-500 text-white" : "bg-white/10 text-white"
              )}
            >
              <MessageSquare size={18} />
            </button>
            
            <button 
              onClick={leaveRoom}
              className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition-colors"
              title="Salir"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Table Area */}
        <div className="flex-1 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="relative w-full max-w-[min(65vw,70vh)] sm:max-w-[min(92vw,70vh)] aspect-square flex items-center justify-center">
            {/* Board */}
            <div className="absolute inset-0 bg-[#1a4d2e] rounded-[30px] sm:rounded-[60px] border-[6px] sm:border-[12px] border-[#2d1b0d] shadow-[inset_0_0_60px_rgba(0,0,0,0.5),0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden">
              {/* Safety Margin Indicator */}
              <div className="absolute inset-2 sm:inset-4 border border-white/5 rounded-[25px] sm:rounded-[45px] pointer-events-none" />
              
              {/* Dynamic Scaling Container for Tiles */}
              <div className="relative w-full h-full flex items-center justify-center">
                {(() => {
                  if (!gameState) return null;
                  const boardLength = gameState.board.length;
                  // Scaling starts after 2 tiles and stops reducing at 14 tiles
                  const effectiveLengthForScale = Math.min(boardLength, 14);
                  const dynamicScale = Math.min(1, 8 / (8 + Math.max(0, effectiveLengthForScale - 2) * 0.5));
                  
                  return (
                    <motion.div 
                      animate={{ scale: dynamicScale }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className="relative scale-[0.8] sm:scale-[0.9] md:scale-100"
                    >
                      <AnimatePresence>
                      {(() => {
                        const pivot = gameState.pivotIndex;
                        const board = gameState.board;
                        
                        if (!board || board.length === 0) return null;

                        /**
                         * SISTEMA DE NODOS MAGNÉTICOS (STRICT IMPLEMENTATION)
                         * 
                         * Unidades: 1 unidad = 1.5rem (24px).
                         * Ficha Simple: 4x2 unidades (6rem x 3rem).
                         * Ficha Doble: 2x4 unidades (3rem x 6rem).
                         */

                        // Pre-calculamos el flujo de cada ficha para manejar el espacio extra de los dobles
                        const flows: ('h' | 'v' | 'r')[] = new Array(board.length);
                        
                        const calculateSideFlows = (indices: number[]) => {
                          let countH = 0;
                          let countV = 0;
                          let currentFlow: 'h' | 'v' | 'r' = 'h';
                          const limitH = isMobile ? 3 : 5;
                          
                          for (const idx of indices) {
                            const tile = board[idx];
                            const isDouble = tile[0] === tile[1];
                            
                            if (currentFlow === 'h') {
                              if (countH < limitH) {
                                flows[idx] = 'h';
                                countH++;
                              } else if (countH === limitH) {
                                if (isDouble) {
                                  flows[idx] = 'h';
                                  countH++; // Aceptamos el doble en el espacio de "X y medio"
                                } else {
                                  currentFlow = 'v';
                                  flows[idx] = 'v';
                                  countV = 1;
                                }
                              } else {
                                currentFlow = 'v';
                                flows[idx] = 'v';
                                countV = 1;
                              }
                            } else if (currentFlow === 'v') {
                              if (countV < 2) {
                                flows[idx] = 'v';
                                countV++;
                              } else if (countV === 2) {
                                if (isDouble) {
                                  flows[idx] = 'v';
                                  countV++; // Aceptamos el doble en el espacio de "2 y medio" vertical
                                } else {
                                  currentFlow = 'r';
                                  flows[idx] = 'r';
                                }
                              } else {
                                currentFlow = 'r';
                                flows[idx] = 'r';
                              }
                            } else {
                              flows[idx] = 'r';
                            }
                          }
                        };

                        flows[pivot] = 'h';
                        const posIndices = [];
                        for (let i = pivot + 1; i < board.length; i++) posIndices.push(i);
                        calculateSideFlows(posIndices);

                        const negIndices = [];
                        for (let i = pivot - 1; i >= 0; i--) negIndices.push(i);
                        calculateSideFlows(negIndices);

                        const getFlowDir = (idx: number) => {
                          const isPositiveSide = idx > pivot;
                          const flow = flows[idx];
                          // En tramo horizontal: derecha (1) u izquierda (-1)
                          if (flow === 'h') return [isPositiveSide ? 1 : -1, 0] as [number, number];
                          // En tramo vertical: derecha sube (-1), izquierda baja (1)
                          if (flow === 'v') return [0, isPositiveSide ? -1 : 1] as [number, number];
                          // En tramo de retorno: derecha vuelve a izquierda (-1), izquierda vuelve a derecha (1)
                          return [isPositiveSide ? -1 : 1, 0] as [number, number];
                        };

                        const getTileMetadata = (idx: number) => {
                          const tile = board[idx];
                          const isDouble = tile[0] === tile[1];
                          const r = Math.abs(idx - pivot);
                          
                          const flow = flows[idx];
                          const isVerticalFlow = flow === 'v';

                          // Regla de Oro:
                          // Flujo Horizontal -> Simples Horizontales, Dobles Verticales.
                          // Flujo Vertical -> Simples Verticales, Dobles Horizontales.
                          const isVertical = isVerticalFlow ? !isDouble : isDouble;

                          return { isDouble, isVertical, r, flow };
                        };

                        const getDisplayTile = (idx: number): [number, number] => {
                          const tile = board[idx];
                          if (idx === pivot) return tile;
                          
                          const step = idx > pivot ? 1 : -1;
                          const prevTile = board[idx - step];
                          
                          // Buscamos el valor de conexión entre esta ficha y la anterior
                          const common = tile.find(v => prevTile.includes(v));
                          if (common === undefined) return tile;
                          
                          const flowDir = getFlowDir(idx);
                          // Si nos movemos hacia la IZQUIERDA o hacia ARRIBA, la conexión está en el lado "final" (index 1 / derecha-abajo)
                          const connectionAtEnd = (flowDir[0] < 0 || flowDir[1] < 0);
                          
                          if (connectionAtEnd) {
                            // Queremos el valor común en el index 1
                            return (tile[1] === common) ? tile : [tile[1], tile[0]];
                          } else {
                            // Queremos el valor común en el index 0
                            return (tile[0] === common) ? tile : [tile[1], tile[0]];
                          }
                        };

                        const centers: {x: number, y: number}[] = [];

                        const obtenerSiguientePosicion = (
                          prevIdx: number,
                          currIdx: number,
                          sideStep: 1 | -1,
                          prevCenter: {x: number, y: number}
                        ) => {
                          const prevMeta = getTileMetadata(prevIdx);
                          const currMeta = getTileMetadata(currIdx);
                          const currFlowDir = getFlowDir(currIdx);
                          const prevFlowDir = getFlowDir(prevIdx);

                          const isTurn = flows[prevIdx] !== flows[currIdx];

                          // Unidades de radio: Largo=2, Corto=1 (basado en fichas de 4x2 unidades de 1.5rem)
                          const radiusH = (m: any) => m.isVertical ? 1 : 2;
                          const radiusV = (m: any) => m.isVertical ? 2 : 1;

                          let currCenter: {x: number, y: number};

                          if (isTurn) {
                            /**
                             * CONEXIÓN EN CURVA (L-SHAPE)
                             * Alineamos los bordes de los cuadrados de conexión para un contacto perfecto.
                             */
                            const hDist = radiusH(prevMeta) + radiusH(currMeta);
                            const vDist = radiusV(prevMeta) + radiusV(currMeta);

                            currCenter = {
                              x: prevCenter.x + currFlowDir[0] * 1 + prevFlowDir[0] * hDist,
                              y: prevCenter.y + currFlowDir[1] * 1 + prevFlowDir[1] * vDist
                            };
                          } else {
                            /**
                             * CONEXIÓN LINEAL (Extremo a Extremo)
                             */
                            const dist = (currFlowDir[0] !== 0) 
                              ? (radiusH(prevMeta) + radiusH(currMeta))
                              : (radiusV(prevMeta) + radiusV(currMeta));

                            currCenter = {
                              x: prevCenter.x + currFlowDir[0] * dist,
                              y: prevCenter.y + currFlowDir[1] * dist
                            };
                          }

                          return currCenter;
                        };

                        centers[pivot] = { x: 0, y: 0 };

                        const calculateChain = (step: 1 | -1) => {
                          for (let i = pivot + step; (step === 1 ? i < board.length : i >= 0); i += step) {
                            centers[i] = obtenerSiguientePosicion(i - step, i, step, centers[i - step]);
                          }
                        };

                        calculateChain(1);
                        calculateChain(-1);

                        return board.map((tile, i) => {
                          const { isVertical } = getTileMetadata(i);
                          const pos = centers[i];
                          const displayTile = getDisplayTile(i);

                          return (
                            <motion.div
                              key={`${tile[0]}-${tile[1]}`}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ 
                                opacity: 1, 
                                scale: 1, // Fixed scale 1 to ensure they touch perfectly
                                x: isVertical ? `${pos.x * unitSize - unitSize}rem` : `${pos.x * unitSize - unitSize * 2}rem`, 
                                y: isVertical ? `${pos.y * unitSize - unitSize * 2}rem` : `${pos.y * unitSize - unitSize}rem` 
                              }}
                              transition={{ 
                                type: "spring", 
                                stiffness: 300, 
                                damping: 30,
                                opacity: { duration: 0.2 }
                              }}
                              style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                zIndex: 10 + i
                              }}
                            >
                              <Tile 
                                tile={displayTile} 
                                isVertical={isVertical} 
                                className={cn(
                                  isMobile ? (isVertical ? "w-6 h-12" : "w-12 h-6") : undefined
                                )}
                              />
                            </motion.div>
                          );
                        });
                      })()}
                  </AnimatePresence>
                </motion.div>
              );
            })()}
            </div>
          </div>

          {/* Opponents in their slots (Positioned relative to the table edges) */}
          <PlayerSlot player={getPlayerAtPosition('left')} position="left" />
          <PlayerSlot player={getPlayerAtPosition('top')} position="top" />
          <PlayerSlot player={getPlayerAtPosition('right')} position="right" />
        </div>

        {/* Side Selection Modal */}
          <AnimatePresence>
            {pendingTile && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
              >
                <div className="bg-white p-8 rounded-3xl shadow-2xl text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">¿Dónde quieres jugar?</h3>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => confirmPlay('left')}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl transition-all"
                    >
                      Izquierda
                    </button>
                    <button 
                      onClick={() => confirmPlay('right')}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl transition-all"
                    >
                      Derecha
                    </button>
                  </div>
                  <button 
                    onClick={() => setPendingTile(null)}
                    className="mt-6 text-gray-400 hover:text-gray-600 font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over Modal */}
          {room.status === 'ended' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
            >
              <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center border border-white/20">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Trophy size={48} className="text-yellow-500" />
                  {gameState?.tranque && (
                    <div className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold border border-red-200">
                      ¡TRANQUE!
                    </div>
                  )}
                </div>
                 <h2 className="text-2xl font-bold text-gray-800 mb-1">¡Juego Terminado!</h2>
                <div className="text-lg text-gray-600 mb-6">
                  {room.settings?.mode === 'pairs' ? (
                    <div>
                      Ganadores: <span className="font-bold text-green-600">Equipo {room.winningTeam === 0 ? 'A' : 'B'}</span>
                    </div>
                  ) : (
                    <div>
                      Ganador: <span className="font-bold text-green-600">{room.players.find(p => p.id === room.winner)?.name}</span>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">Puntuación Final</div>
                  {room.players.map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{p.name} {room.settings?.mode === 'pairs' ? `(Team ${i % 2 === 0 ? 'A' : 'B'})` : ''}</span>
                      <span className="font-bold text-gray-900">{p.score} pts</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={startGame}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                  >
                    <RotateCcw size={20} />
                    Jugar de nuevo
                  </button>
                  <button 
                    onClick={leaveRoom}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut size={20} />
                    Salir de la sala
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Player Hand */}
        <div className="bg-black/40 backdrop-blur-md p-2 sm:p-5 pt-8 sm:pt-10 relative border-t border-white/5">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "px-3 py-1 sm:px-6 sm:py-1.5 rounded-full font-black shadow-lg text-[9px] sm:text-sm tracking-widest transition-all",
              isMyTurn ? "bg-yellow-400 text-black scale-105" : "bg-gray-800 text-gray-400"
            )}>
              {room.status === 'ended' ? "JUEGO TERMINADO" : (isMyTurn ? "¡TU TURNO!" : "ESPERANDO JUGADA...")}
            </div>
            {currentPlayer && (
              <div className="bg-blue-600 text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-full font-black shadow-lg text-[9px] sm:text-sm flex items-center gap-2">
                <span className="opacity-70 text-[8px] uppercase hidden xs:inline">Tu Score:</span>
                {currentPlayer.score} pts
              </div>
            )}
          </div>
          
          <div className="max-w-5xl mx-auto flex flex-col items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-0.5 mb-1 sm:mb-2">
               <span className="text-white/40 text-[7px] sm:text-[10px] uppercase font-bold tracking-[0.3em]">Tus Fichas</span>
               {currentPlayer && (
                 <span className="text-green-400 text-[9px] sm:text-xs font-bold bg-green-400/10 px-2 sm:px-3 rounded-full border border-green-400/20">
                   {currentPlayer.hand.length} Restantes
                 </span>
               )}
            </div>
            <div className="flex justify-center gap-1 sm:gap-4 flex-wrap px-2">
              {currentPlayer?.hand.map((tile, i) => (
                <Tile
                  key={`${tile[0]}-${tile[1]}-${i}`}
                  tile={tile}
                  onClick={() => handlePlay(tile)}
                  disabled={isRoundOver || room.status === 'ended' || !isMyTurn || !canPlay(tile, gameState?.board || [])}
                  isVertical
                  className="transition-all duration-300 w-7 h-14 sm:w-12 sm:h-24 scale-[0.8] sm:scale-100"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Sidebar (Desktop) */}
      <div className="hidden lg:block">
        <Chat />
      </div>
    </div>
  );
};

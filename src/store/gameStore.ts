
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Tile, GameState, RoomSettings } from '../lib/gameEngine';

interface GameStore {
  socket: Socket | null;
  roomId: string | null;
  playerName: string;
  room: any;
  gameState: GameState | null;
  isConnected: boolean;
  
  connect: (playerName: string) => void;
  joinRoom: (roomId: string) => void;
  createRoom: (settings: RoomSettings) => void;
  startGame: () => void;
  playTile: (tile: Tile, side: 'left' | 'right' | 'both') => void;
  addBot: () => void;
  leaveRoom: () => void;
  setPlayerName: (name: string) => void;
  confirmRound: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  roomId: null,
  playerName: '',
  room: null,
  gameState: null,
  isConnected: false,

  setPlayerName: (name) => set({ playerName: name }),

  connect: (playerName) => {
    if (get().socket) return;
    
    console.log('Initiating connection to server...');
    
    // Explicitly determine origin for robustness
    const socketUrl = window.location.origin;
    
    const socket = io(socketUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000,
      transports: ['polling', 'websocket'] // Ensure polling as fallback
    });
    
    socket.on('connect', () => {
      console.log('Socket.io connected successfully:', socket.id);
      set({ isConnected: true });
    });

    socket.on('connection_acknowledged', (data) => {
      console.log('Server acknowledged connection:', data);
      set({ isConnected: true });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error.message);
      set({ isConnected: false });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.io disconnected:', reason);
      set({ isConnected: false });
    });

    socket.on('room_update', (room) => {
      set({ room, gameState: room.gameState });
    });

    socket.on('game_started', (room) => {
      set({ room, gameState: room.gameState });
    });

    socket.on('game_ended', (room) => {
      set({ room, gameState: room.gameState });
    });

    socket.on('room_created', (roomId) => {
      get().joinRoom(roomId);
    });

    set({ socket });
  },

  joinRoom: (roomId) => {
    const { socket, playerName } = get();
    if (!socket) return;
    socket.emit('join_room', { roomId, playerName });
    set({ roomId });
  },

  createRoom: (settings) => {
    const { socket } = get();
    if (!socket) return;
    socket.emit('create_room', settings);
  },

  leaveRoom: () => {
    const { socket, roomId } = get();
    if (socket && roomId) {
      socket.emit('leave_room', roomId);
    }
    set({ room: null, roomId: null, gameState: null });
  },

  startGame: () => {
    const { socket, roomId } = get();
    if (!socket || !roomId) return;
    socket.emit('start_game', roomId);
  },

  addBot: () => {
    const { socket, roomId } = get();
    if (!socket || !roomId) return;
    socket.emit('add_bot', roomId);
  },

  playTile: (tile, side) => {
    const { socket, roomId } = get();
    if (!socket || !roomId) return;
    socket.emit('play_tile', { roomId, tile, side });
  },
  confirmRound: () => {
    const { socket, roomId } = get();
    if (!socket || !roomId) return;
    socket.emit('confirm_round', roomId);
  },
}));


import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Play, Plus, LogIn, X, Trophy, User } from 'lucide-react';

export const Lobby: React.FC = () => {
  const { socket, connect, joinRoom, createRoom, setPlayerName, playerName, isConnected } = useGameStore();
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Room Settings State
  const [maxPoints, setMaxPoints] = useState(100);
  const [playersCount, setPlayersCount] = useState<2 | 3 | 4>(4);
  const [mode, setMode] = useState<'individual' | 'pairs'>('individual');

  const handleConnect = () => {
    if (!name) return;
    setPlayerName(name);
    connect(name);
  };

  React.useEffect(() => {
    if (isConnected && !hasJoined && playerName) {
      setHasJoined(true);
    }
  }, [isConnected, hasJoined, playerName]);

  const handleJoin = (id: string) => {
    if (!id) return;
    joinRoom(id);
  };

  const handleCreatePrivate = () => {
    createRoom({
      maxPoints,
      playersCount,
      mode: playersCount === 4 ? mode : 'individual'
    });
    setIsCreatingRoom(false);
  };

  if (!hasJoined || !isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-green-900 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center"
        >
          {/* Custom Domino Logo */}
          <div className="flex justify-center mb-8">
            <motion.div 
              initial={{ rotate: -15, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="relative flex items-center justify-center -space-x-4"
            >
              {/* Tile 6-6 - White Tile */}
              <div className="w-14 h-24 bg-white border-[3px] border-gray-900 rounded-xl flex flex-col p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.15)] transform -rotate-12 -translate-x-1 relative z-0 overflow-hidden">
                <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-y-1 gap-x-2 place-items-center">
                   {[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-gray-900 rounded-full shadow-inner" />)}
                </div>
                <div className="h-[2px] w-full bg-gray-900/10 my-1 rounded-full shrink-0" />
                <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-y-1 gap-x-2 place-items-center">
                   {[...Array(6)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-gray-900 rounded-full shadow-inner" />)}
                </div>
              </div>

              {/* Tile 3-1 - Green Tile */}
              <div className="w-14 h-24 bg-green-500 border-[3px] border-gray-900 rounded-xl flex flex-col p-4 shadow-[6px_6px_0px_rgba(0,0,0,0.2)] transform rotate-12 translate-x-1 z-10 relative overflow-hidden">
                {/* 3 side (Top) */}
                <div className="flex-1 relative w-full">
                   <div className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full shadow-sm" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-sm" />
                   <div className="absolute bottom-0 right-0 w-2 h-2 bg-white rounded-full shadow-sm" />
                </div>
                {/* Center Line */}
                <div className="h-[2px] w-full bg-white/30 my-1 rounded-full shrink-0" />
                {/* 1 side (Bottom) */}
                <div className="flex-1 flex items-center justify-center w-full">
                   <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </motion.div>
          </div>

          <h1 className="text-4xl font-bold text-green-800 mb-2">Dominó RD</h1>
          <p className="text-gray-600 mb-8">¡El mejor dominó online!</p>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors text-black"
            />
            <button
              onClick={handleConnect}
              disabled={!name || (socket !== null && !isConnected)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {socket !== null && !isConnected ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Entrar al Lobby
                </>
              )}
            </button>
            {socket !== null && !isConnected && (
              <p className="text-xs text-red-500 mt-2 font-medium">
                Intentando conectar con el servidor...
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-900 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3 rotate-12 scale-90 origin-left">
              <div className="w-5 h-9 bg-gray-900 rounded-md flex flex-col p-1.5 gap-0.5 overflow-hidden">
                <div className="flex-1 grid grid-cols-2 grid-rows-3 place-items-center gap-0">
                  {[...Array(6)].map((_, i) => <div key={i} className="w-0.5 h-0.5 bg-white rounded-full" />)}
                </div>
                <div className="h-[0.5px] w-full bg-white opacity-20 shrink-0" />
                <div className="flex-1 grid grid-cols-2 grid-rows-3 place-items-center gap-0">
                  {[...Array(6)].map((_, i) => <div key={i} className="w-0.5 h-0.5 bg-white rounded-full" />)}
                </div>
              </div>
              <div className="w-5 h-9 bg-green-500 border border-gray-900 rounded-md flex flex-col p-1 gap-0.5 z-10 relative overflow-hidden">
                <div className="flex-1 relative w-full h-full">
                   <div className="absolute top-0 w-0.5 h-0.5 bg-white rounded-full shadow-sm" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-white rounded-full shadow-sm" />
                   <div className="absolute bottom-0 right-0 w-0.5 h-0.5 bg-white rounded-full shadow-sm" />
                </div>
                <div className="h-[0.5px] w-full bg-white opacity-30 shrink-0" />
                <div className="flex-1 flex items-center justify-center w-full h-full">
                  <div className="w-0.5 h-0.5 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Salas</h2>
          </div>
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <Users size={18} />
            <span>{playerName}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Unirse a sala</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Código de sala"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none text-black"
              />
              <button
                onClick={() => handleJoin(roomId)}
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-xl transition-colors"
              >
                <LogIn size={24} />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O crea una nueva</span>
            </div>
          </div>

          <button
            onClick={() => setIsCreatingRoom(true)}
            className="w-full border-2 border-green-600 text-green-600 hover:bg-green-50 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Configurar Sala Privada
          </button>
        </div>
      </motion.div>

      {/* Configuration Modal */}
      <AnimatePresence>
        {isCreatingRoom && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-green-50/50">
                <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                  <Plus className="text-green-600" size={18} />
                  Nueva Sala Privada
                </h3>
                <button 
                  onClick={() => setIsCreatingRoom(false)}
                  className="p-1.5 hover:bg-green-100 rounded-full transition-colors text-green-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Max Points */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <Trophy size={14} className="text-yellow-500" />
                      Puntos Máximos
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        placeholder="Ej: 100"
                        value={maxPoints}
                        onChange={(e) => setMaxPoints(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-green-500 focus:outline-none transition-all text-lg font-black text-gray-800"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-xs">
                        PTS
                      </div>
                    </div>
                  </div>

                  {/* Players Count */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <Users size={14} className="text-blue-500" />
                      Jugadores
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[2, 3, 4].map((count) => (
                        <button
                          key={count}
                          onClick={() => {
                            setPlayersCount(count as 2 | 3 | 4);
                            if (count < 4) setMode('individual');
                          }}
                          className={`py-2 px-1 rounded-xl border-2 transition-all font-bold text-sm ${
                            playersCount === count 
                              ? 'border-green-600 bg-green-600 text-white shadow-md' 
                              : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-green-200'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mode (Conditional) */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <User size={14} className="text-purple-500" />
                    Formato de Juego
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMode('individual')}
                      className={`py-2 px-4 rounded-xl border-2 transition-all font-bold text-sm ${
                        mode === 'individual' 
                          ? 'border-green-600 bg-green-600 text-white shadow-md' 
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-green-200'
                      }`}
                    >
                      Individual
                    </button>
                    <button
                      disabled={playersCount < 4}
                      onClick={() => setMode('pairs')}
                      className={`py-2 px-4 rounded-xl border-2 transition-all font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed ${
                        mode === 'pairs' 
                          ? 'border-green-600 bg-green-600 text-white shadow-md' 
                          : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-green-200'
                      }`}
                    >
                      Parejas
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleCreatePrivate}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base"
                  >
                    <Play size={18} />
                    ¡Crear y Empezar!
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

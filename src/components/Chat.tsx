
import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Chat: React.FC = () => {
  const { socket, roomId, playerName } = useGameStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('chat_message');
    };
  }, [socket]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket || !roomId) return;

    const msg = { sender: playerName, text: message };
    socket.emit('send_chat', { roomId, ...msg });
    setMessage('');
  };

  return (
    <div className="w-full lg:w-80 bg-black/40 backdrop-blur-md border-l border-white/10 flex flex-col h-full">
      <div className="p-4 border-b border-white/10 font-bold text-sm uppercase tracking-wider text-white/60">
        Chat en vivo
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex flex-col ${msg.sender === playerName ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[10px] text-white/40 mb-1">{msg.sender}</span>
              <div className={`px-3 py-2 rounded-2xl text-sm max-w-[90%] ${
                msg.sender === playerName ? 'bg-green-600 text-white' : 'bg-white/10 text-white'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSend} className="p-4 bg-black/20">
        <div className="relative">
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-white border border-white/10 rounded-full py-2 pl-4 pr-10 text-sm text-black focus:outline-none focus:border-green-500 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 bottom-1 px-3 text-green-500 hover:text-green-400 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

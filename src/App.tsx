import React from 'react';
import { useGameStore } from './store/gameStore';
import { Lobby } from './components/Lobby';
import { GameTable } from './components/GameTable';

export default function App() {
  const { room } = useGameStore();

  return (
    <div className="min-h-screen bg-emerald-900 font-sans antialiased">
      {!room ? <Lobby /> : <GameTable />}
    </div>
  );
}

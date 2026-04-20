
import React from 'react';
import { motion } from 'motion/react';
import { Tile as TileType } from '../lib/gameEngine';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TileProps {
  tile: TileType;
  onClick?: () => void;
  disabled?: boolean;
  isVertical?: boolean;
  className?: string;
}

const Dot = ({ value, isVertical }: { value: number; isVertical: boolean }) => {
  const positions = [
    [], // 0
    [4], // 1
    [0, 8], // 2
    [0, 4, 8], // 3
    [0, 2, 6, 8], // 4
    [0, 2, 4, 6, 8], // 5
    isVertical ? [0, 2, 3, 5, 6, 8] : [0, 1, 2, 6, 7, 8], // 6
  ];

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-0.5 w-full h-full p-1">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="flex items-center justify-center">
          {positions[value].includes(i) && (
            <div className="w-[60%] h-[60%] bg-black rounded-full shadow-inner" />
          )}
        </div>
      ))}
    </div>
  );
};

export const Tile: React.FC<TileProps> = ({ tile, onClick, disabled, isVertical = false, className }) => {
  const [a, b] = tile;

  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.05, y: -5 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "relative flex bg-[#f5f5dc] border border-gray-300 cursor-pointer overflow-hidden",
        "bg-gradient-to-br from-white to-[#f5f5dc]",
        isVertical ? "flex-col" : "flex-row",
        !className?.includes('w-') && (isVertical ? "w-12 h-24" : "w-24 h-12"),
        disabled && "cursor-default",
        className
      )}
    >
      <div className={cn("flex flex-1 items-center justify-center", isVertical ? "w-full h-1/2" : "w-1/2 h-full")}>
        <Dot value={a} isVertical={isVertical} />
      </div>
      <div className={cn("bg-gray-300 relative", isVertical ? "h-0.5 w-full" : "w-0.5 h-full")}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-yellow-600 rounded-full border border-yellow-800 shadow-sm" />
      </div>
      <div className={cn("flex flex-1 items-center justify-center", isVertical ? "w-full h-1/2" : "w-1/2 h-full")}>
        <Dot value={b} isVertical={isVertical} />
      </div>
    </motion.div>
  );
};

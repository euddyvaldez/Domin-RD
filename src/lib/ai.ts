
import { Tile, canPlay, getTilePoints } from './gameEngine';

export type Difficulty = 'easy' | 'medium' | 'hard';

export const getAIMove = (
  hand: Tile[],
  board: Tile[],
  difficulty: Difficulty,
  opponentHands?: Tile[][] // Optional for hard mode
): { tile: Tile; side: 'left' | 'right' } | null => {
  const validMoves: { tile: Tile; side: 'left' | 'right' }[] = [];
  
  hand.forEach(tile => {
    const side = canPlay(tile, board);
    if (side === 'both') {
      validMoves.push({ tile, side: 'left' });
      validMoves.push({ tile, side: 'right' });
    } else if (side) {
      validMoves.push({ tile, side });
    }
  });

  if (validMoves.length === 0) return null;

  if (difficulty === 'easy') {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  if (difficulty === 'medium') {
    // Prioritize doubles and then higher points
    return validMoves.sort((a, b) => {
      const aIsDouble = a.tile[0] === a.tile[1];
      const bIsDouble = b.tile[0] === b.tile[1];
      if (aIsDouble && !bIsDouble) return -1;
      if (!aIsDouble && bIsDouble) return 1;
      return getTilePoints(b.tile) - getTilePoints(a.tile);
    })[0];
  }

  // Hard: Heuristic based on points and blocking
  // For now, let's use a refined version of medium
  return validMoves.sort((a, b) => {
    const aIsDouble = a.tile[0] === a.tile[1];
    const bIsDouble = b.tile[0] === b.tile[1];
    
    // 1. Doubles first
    if (aIsDouble && !bIsDouble) return -1;
    if (!aIsDouble && bIsDouble) return 1;
    
    // 2. Higher points (to minimize hand points)
    const pointsDiff = getTilePoints(b.tile) - getTilePoints(a.tile);
    if (pointsDiff !== 0) return pointsDiff;
    
    return 0;
  })[0];
};

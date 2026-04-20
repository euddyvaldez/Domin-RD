
export type Tile = [number, number];

export interface RoomSettings {
  maxPoints: number;
  playersCount: 2 | 3 | 4;
  mode: 'individual' | 'pairs';
}

export interface GameState {
  board: Tile[];
  pivotIndex: number;
  turnIndex: number;
  history: { playerId: string; tile: Tile; side: 'left' | 'right' }[];
  tranque: boolean;
  isCapicua: boolean;
  roundWinnerId?: string;
  roundPoints?: number;
}

export const createDeck = (): Tile[] => {
  const deck: Tile[] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      deck.push([i, j]);
    }
  }
  return deck;
};

export const shuffle = (deck: Tile[]): Tile[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const deal = (numPlayers: number = 4): Tile[][] => {
  const deck = shuffle(createDeck());
  const hands: Tile[][] = [];
  for (let i = 0; i < numPlayers; i++) {
    hands.push(deck.slice(i * 7, (i + 1) * 7));
  }
  return hands;
};

export const canPlay = (tile: Tile, board: Tile[]): 'left' | 'right' | 'both' | null => {
  if (board.length === 0) return 'both';
  
  const left = board[0][0];
  const right = board[board.length - 1][1];
  
  const canLeft = tile[0] === left || tile[1] === left;
  const canRight = tile[0] === right || tile[1] === right;
  
  if (canLeft && canRight) return 'both';
  if (canLeft) return 'left';
  if (canRight) return 'right';
  return null;
};

export const getTilePoints = (tile: Tile): number => tile[0] + tile[1];

export const calculateHandPoints = (hand: Tile[]): number => 
  hand.reduce((sum, tile) => sum + getTilePoints(tile), 0);

export const findStartingPlayer = (hands: Tile[][]): number => {
  // In Dominican rules, 6-6 starts the first game
  for (let i = 0; i < hands.length; i++) {
    if (hands[i].some(t => t[0] === 6 && t[1] === 6)) return i;
  }
  return 0; // Fallback
};

export const isTranque = (board: Tile[], hands: Tile[][]): boolean => {
  if (board.length === 0) return false;
  const left = board[0][0];
  const right = board[board.length - 1][1];
  
  return hands.every(hand => 
    hand.every(tile => 
      tile[0] !== left && tile[1] !== left && tile[0] !== right && tile[1] !== right
    )
  );
};

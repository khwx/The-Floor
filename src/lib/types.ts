export type Player = 'player' | 'ai';

export type Territory = {
  theme: string;
};

export type TileData = {
  id: number;
  theme: string;
  owner: Player | 'unowned';
};

export type GameDifficulty = 'easy' | 'medium' | 'hard';

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

export type Question = {
  question: string;
  options: string[];
  answer: string;
  imageQuery: string;
  imageUrl?: string;
};

export type DuelState = {
  challenger: Player;
  defender: Player;
  timeRemaining: number;
  questions: Question[];
  activeQuestionIndex: number;
  turn: 'challenger' | 'defender';
};

    
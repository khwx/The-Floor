export type Player = 'player' | 'ai' | 'player1' | 'player2';

export type Territory = {
  theme: string;
};

export type TileData = {
  id: number;
  theme: string;
  owner: Player | 'unowned';
};

export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'epic';

export type Question = {
  question: string;
  options: string[];
  answer: string;
  imageQuery: string;
  imageUrl?: string;
};

export type DuelState = {
  challenger: Player;
  questions: Question[];
  activeQuestionIndex: number;
  playerCorrect: number;
  aiCorrect: number; // In multiplayer, this could be player2's correct count.
  timeRemaining: number;
};

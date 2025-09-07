export type Player = 'player' | 'ai' | 'player1' | 'player2';
export type PlayerRole = 'player1' | 'player2';

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
  aiCorrect: number; 
  timeRemaining: number;
};

// Firestore Game State
export type GameStatus = 'waiting' | 'playing' | 'finished';

export type GameState = {
    gameId: string;
    difficulty: GameDifficulty;
    language: string;
    status: GameStatus;
    board: TileData[];
    scores: { player1: number; player2: number; };
    turn: PlayerRole;
    players: {
        player1: string; // user ID
        player2: string | null; // user ID
    }
    winner?: PlayerRole | 'draw';
}

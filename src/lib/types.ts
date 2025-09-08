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

// Firestore Game State for Multiplayer
export type GameStatus = 'waiting' | 'generating' | 'playing' | 'processing' | 'question' | 'duel' | 'finished' | 'error';

// This represents the question/duel currently active in a multiplayer game
export type ActiveQuestionInfo = {
    challenger: PlayerRole;
    tile: TileData;
    question: Question;
};

// This represents a duel state in a multiplayer game
export type MultiplayerDuelState = {
    challenger: PlayerRole;
    tile: TileData;
    questions: Question[];
    activeQuestionIndex: number;
    // Keep track of which player has answered the current question
    answers: { [questionIndex: number]: { [player in PlayerRole]?: boolean } };
    scores: {
        player1: number;
        player2: number;
    };
    timeRemaining: number;
}


export type GameState = {
    gameId: string;
    difficulty: GameDifficulty;
    language: string;
    status: GameStatus;
    errorMessage?: string;
    board: TileData[];
    scores: { player1: number; player2: number; };
    turn: PlayerRole;
    players: {
        player1: string; // user ID
        player2: string | null; // user ID
    }
    winner?: PlayerRole | 'draw' | null;
    activeQuestion?: ActiveQuestionInfo | null;
    duelState?: MultiplayerDuelState | null;
}

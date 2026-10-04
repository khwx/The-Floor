export type Player = 'player' | 'ai' | 'player1' | 'player2' | 'player3' | 'player4';
export type PlayerRole = 'player1' | 'player2' | 'player3' | 'player4';
export type TeamId = 'team1' | 'team2';

export type Team = {
    id: TeamId;
    name: string;
    members: PlayerRole[]; // array of player roles
};

export type GameMode = '1v1' | 'team';

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
        player3: number;
        player4: number;
    };
    timeRemaining: number;
}


export type GameState = {
    gameId: string;
    gameMode: GameMode;
    difficulty: GameDifficulty;
    language: string;
    status: GameStatus;
    errorMessage?: string;
    board: TileData[];
    scores: { player1: number; player2: number; player3: number; player4: number; };
    turn: PlayerRole;
    players: {
        player1: string; // user ID
        player2: string | null; // user ID
        player3: string | null; // user ID
        player4: string | null; // user ID
    }
    playerTokens: {
        player1: string;
        player2: string | null;
        player3: string | null;
        player4: string | null;
    };
    teams: Team[];
    winner?: PlayerRole | TeamId | 'draw' | null;
    activeQuestion?: ActiveQuestionInfo | null;
    duelState?: MultiplayerDuelState | null;
}

export type SinglePlayerGameState = 'setup' | 'loading_board' | 'playing' | 'fetching_question' | 'ai_turn' | 'question' | 'duel' | 'finished';

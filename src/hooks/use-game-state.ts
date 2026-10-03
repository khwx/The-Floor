'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SinglePlayerGameState, Player, TileData, DuelState, Question, GameDifficulty } from '@/lib/types';
import { getNeighbors } from '@/lib/grid';
import { useToast } from '@/hooks/use-toast';
import { useAudio } from '@/hooks/use-audio';

type GameState = SinglePlayerGameState;

const DUEL_TIME_PER_QUESTION = 15;
const MIN_DUEL_QUESTIONS = 5;

const AI_ACCURACY: Record<GameDifficulty, number> = {
  easy: 0.45,
  medium: 0.60,
  hard: 0.75,
  epic: 0.90,
};

interface UseGameStateOptions {
  onGenerateQuestions: (theme: string, language: string, count: number) => Promise<Question[] | { error: string }>;
  onCheckEndGame: (board: TileData[]) => boolean;
  language: string;
  difficulty: GameDifficulty;
}

interface UseGameStateReturn {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  board: TileData[];
  setBoard: (board: TileData[]) => void;
  scores: { player: number; ai: number };
  setScores: (scores: { player: number; ai: number }) => void;
  turn: Player;
  setTurn: (turn: Player) => void;
  activeTile: TileData | null;
  setActiveTile: (tile: TileData | null) => void;
  activeQuestion: Question | null;
  setActiveQuestion: (question: Question | null) => void;
  duel: DuelState | null;
  setDuel: (duel: DuelState | null) => void;
  winner: Player | 'draw' | null;
  setWinner: (winner: Player | 'draw' | null) => void;
  aiAction: string;
  setAiAction: (action: string) => void;
  gridSize: { rows: number; cols: number };
  setGridSize: (size: { rows: number; cols: number }) => void;
  handleTileClick: (tile: TileData) => Promise<void>;
  handleAnswer: (correct: boolean) => void;
  handleModalClose: () => void;
  endTurn: (wasTurnSuccessful: boolean, currentTurnPlayer: Player, tileConquered: TileData | null) => void;
  endDuel: (finalDuelState: DuelState, duelTile: TileData) => void;
  resetGame: () => void;
}

export function useGameState({
  onGenerateQuestions,
  onCheckEndGame,
  language,
  difficulty,
}: UseGameStateOptions): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [board, setBoard] = useState<TileData[]>([]);
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [turn, setTurn] = useState<Player>('player');
  const [activeTile, setActiveTile] = useState<TileData | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [duel, setDuel] = useState<DuelState | null>(null);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [aiAction, setAiAction] = useState<string>('');
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });

  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { playAudio } = useAudio();

  const checkEndGame = useCallback((newBoard: TileData[]) => {
    const playerScore = newBoard.filter(tile => tile.owner === 'player').length;
    const aiScore = newBoard.filter(tile => tile.owner === 'ai').length;

    if (playerScore === 0 || aiScore === 0 || playerScore + aiScore === newBoard.length) {
       if (playerScore > aiScore) setWinner('player');
      else if (aiScore > playerScore) setWinner('ai');
      else setWinner('draw');
      setGameState('finished');
      return true;
    }
    return false;
  }, []);

  const endTurn = useCallback((wasTurnSuccessful: boolean, currentTurnPlayer: Player, tileConquered: TileData | null) => {
    let newBoard = [...board];
    let tileWasConquered = false;
    
    if (wasTurnSuccessful && tileConquered) {
      playAudio('/sounds/conquer.mp3');
      const winnerOfTurn = currentTurnPlayer;
      const loserOfTurn = winnerOfTurn === 'player' ? 'ai' : 'player';
      
      const isDuelWin = tileConquered.owner === loserOfTurn;

      if (isDuelWin) {
          tileWasConquered = true;
          const conqueredTheme = tileConquered.theme;
          newBoard = newBoard.map(t => {
            if (t.owner === loserOfTurn && t.theme === conqueredTheme) {
              return { ...t, owner: winnerOfTurn };
            }
            return t;
          });
      } else if (tileConquered.owner === 'unowned') {
          tileWasConquered = true;
          newBoard = newBoard.map(t =>
            t.id === tileConquered.id ? { ...t, owner: winnerOfTurn } : t
          );
      }
    }

    const newScores = {
      player: newBoard.filter(t => t.owner === 'player').length,
      ai: newBoard.filter(t => t.owner === 'ai').length,
    };
    
    setScores(newScores);
    setBoard(newBoard);
    
    setActiveTile(null);
    setActiveQuestion(null);
    setDuel(null);
    if(timerRef.current) clearInterval(timerRef.current);

    if (checkEndGame(newBoard)) {
      return;
    }
    
    if (tileWasConquered) {
      setGameState(currentTurnPlayer === 'ai' ? 'ai_turn' : 'playing');
    } else {
      const nextTurn = currentTurnPlayer === 'player' ? 'ai' : 'player';
      setTurn(nextTurn);
      setGameState(nextTurn === 'ai' ? 'ai_turn' : 'playing');
    }
  }, [board, checkEndGame, playAudio]);

  const endDuel = useCallback((finalDuelState: DuelState, duelTile: TileData) => {
    let wasTurnSuccessful: boolean;
    if (finalDuelState.challenger === 'player') {
      wasTurnSuccessful = finalDuelState.playerCorrect > finalDuelState.aiCorrect;
    } else {
      wasTurnSuccessful = finalDuelState.aiCorrect > finalDuelState.playerCorrect;
    }
    
    toast({
      title: 'Duelo Terminado!',
      description: wasTurnSuccessful
        ? `O desafiante (${finalDuelState.challenger}) venceu o duelo!`
        : `O defensor (${finalDuelState.challenger === 'player' ? 'ai' : 'player'}) venceu o duelo!`,
      variant: wasTurnSuccessful ? 'default' : 'destructive',
    });

    setTimeout(() => {
      endTurn(wasTurnSuccessful, finalDuelState.challenger, duelTile);
    }, 1500);
  }, [endTurn, toast]);

  const handleTileClick = async (tile: TileData) => {
    if (gameState !== 'playing' || turn !== 'player') return;

    const playerTileIds = board.filter(t => t.owner === 'player').map(t => t.id);
    const isAdjacent = getNeighbors(tile.id, gridSize.cols, gridSize.rows).some(n => playerTileIds.includes(n));

    if (tile.owner === 'unowned' && !isAdjacent) {
      toast({ title: 'Casa inválida', description: 'Só pode conquistar casas adjacentes às suas.', variant: 'destructive' });
      return;
    }

    setActiveTile(tile);
    setGameState('fetching_question');

    const isDuel = tile.owner === 'ai';
    const questionTheme = tile.theme;

    let questionCount = 1;
    if (isDuel) {
      playAudio('/sounds/duel.mp3');
      const territoryCount = board.filter(t => t.owner === 'ai' && t.theme === questionTheme).length;
      questionCount = Math.max(MIN_DUEL_QUESTIONS, territoryCount);
    }

    const questionResult = await onGenerateQuestions(questionTheme, language, questionCount);
    
    if ('error' in questionResult) {
        toast({
            title: 'Falha ao obter pergunta(s)',
            description: questionResult.error,
            variant: 'destructive',
        });
        setGameState('playing');
        setActiveTile(null);
        return;
    }
    
    if (isDuel) {
        const totalDuelTime = DUEL_TIME_PER_QUESTION * questionResult.length;
        setActiveQuestion(questionResult[0]);
        setDuel({
            challenger: 'player',
            questions: questionResult,
            activeQuestionIndex: 0,
            playerCorrect: 0,
            aiCorrect: 0,
            timeRemaining: totalDuelTime,
        });
        setGameState('duel');
    } else { 
        setActiveQuestion(questionResult[0]);
        setGameState('question');
    }
  };

  const handleAnswer = (correct: boolean) => {
    if (!activeTile) return;

    if (correct) {
      playAudio('/sounds/correct.mp3');
    } else {
      playAudio('/sounds/incorrect.mp3');
    }

    if (gameState === 'question') {
      const tileToConquer = activeTile;
      setTimeout(() => endTurn(correct, 'player', tileToConquer), 1500);
      return;
    }

    if (gameState === 'duel' && duel) {
      const aiAcc = AI_ACCURACY[difficulty];
      const newPlayerCorrect = duel.playerCorrect + (correct ? 1 : 0);
      const aiResponseCorrect = Math.random() < aiAcc;
      const newAiCorrect = duel.aiCorrect + (aiResponseCorrect ? 1 : 0);

      const nextQuestionIndex = duel.activeQuestionIndex + 1;
      const updatedDuelState: DuelState = {
          ...duel,
          playerCorrect: newPlayerCorrect,
          aiCorrect: newAiCorrect,
      };

      if (nextQuestionIndex < duel.questions.length) {
        setTimeout(() => {
            setDuel({
              ...updatedDuelState,
              activeQuestionIndex: nextQuestionIndex,
            });
            setActiveQuestion(duel.questions[nextQuestionIndex]);
        }, 1500); 
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        const tileToConquer = activeTile;
        setDuel(updatedDuelState); 
        endDuel(updatedDuelState, tileToConquer);
      }
    }
  };
  
  const handleModalClose = () => {
    if (!activeTile) return;
    if (gameState === 'question') {
      endTurn(false, 'player', activeTile);
    }
    if (gameState === 'duel' && duel) {
       if (timerRef.current) clearInterval(timerRef.current);
      endDuel(duel, activeTile);
    }
  };

  const resetGame = () => {
    setGameState('setup');
    setBoard([]);
    setScores({ player: 0, ai: 0 });
    setTurn('player');
    setWinner(null);
    setActiveTile(null);
    setActiveQuestion(null);
    setDuel(null);
  };

  useEffect(() => {
    if (gameState === 'duel' && duel && duel.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setDuel(prevDuel => {
          if (prevDuel && prevDuel.timeRemaining > 0) {
            return { ...prevDuel, timeRemaining: prevDuel.timeRemaining - 1 };
          }
          return prevDuel;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, duel]);

  useEffect(() => {
    if (gameState === 'duel' && duel && duel.timeRemaining === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      toast({
        title: "O tempo acabou!",
        description: "O desafiante perdeu o duelo.",
        variant: "destructive",
      });
      if(activeTile){
        endDuel(duel, activeTile);
      }
    }
  }, [gameState, duel, activeTile, endDuel, toast]);

  return {
    gameState,
    setGameState,
    board,
    setBoard,
    scores,
    setScores,
    turn,
    setTurn,
    activeTile,
    setActiveTile,
    activeQuestion,
    setActiveQuestion,
    duel,
    setDuel,
    winner,
    setWinner,
    aiAction,
    setAiAction,
    gridSize,
    setGridSize,
    handleTileClick,
    handleAnswer,
    handleModalClose,
    endTurn,
    endDuel,
    resetGame,
  };
}
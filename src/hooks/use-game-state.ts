'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SinglePlayerGameState, Player, TileData, Question, GameDifficulty } from '@/lib/types';
import { getNeighbors } from '@/lib/grid';
import { useToast } from '@/hooks/use-toast';
import { useAudio } from '@/hooks/use-audio';
import { useDuel } from '@/hooks/use-duel';

type GameState = SinglePlayerGameState;

const MIN_DUEL_QUESTIONS = 5;

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
  duel: import('@/lib/types').DuelState | null;
  setDuel: (duel: import('@/lib/types').DuelState | null) => void;
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
  endDuel: (finalDuelState: import('@/lib/types').DuelState, duelTile: TileData) => void;
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
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [aiAction, setAiAction] = useState<string>('');
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });

  const { toast } = useToast();
  const { playAudio } = useAudio();

  const duelHook = useDuel({
    difficulty,
    language,
    onEndDuel: (finalDuelState, duelTile) => {
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
    },
    onEndTurn: (wasTurnSuccessful, currentTurnPlayer, tileConquered) => {
      endTurn(wasTurnSuccessful, currentTurnPlayer, tileConquered);
    },
    generateQuestions: onGenerateQuestions,
    getBoard: () => board,
  });

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
    
    duelHook.resetDuel();

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
  }, [board, checkEndGame, playAudio, duelHook]);

  const handleTileClick = async (tile: TileData) => {
    if (gameState !== 'playing' || turn !== 'player') return;

    const playerTileIds = board.filter(t => t.owner === 'player').map(t => t.id);
    const isAdjacent = getNeighbors(tile.id, gridSize.cols, gridSize.rows).some(n => playerTileIds.includes(n));

    if (tile.owner === 'unowned' && !isAdjacent) {
      toast({ title: 'Casa inválida', description: 'Só pode conquistar casas adjacentes às suas.', variant: 'destructive' });
      return;
    }

    duelHook.setActiveTile(tile);
    setGameState('fetching_question');

    const isDuel = tile.owner === 'ai';
    const questionTheme = tile.theme;

    let questionCount = 1;
    if (isDuel) {
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
        duelHook.setActiveTile(null);
        return;
    }
    
    if (isDuel) {
        await duelHook.startDuel(tile, 'player');
    } else { 
        duelHook.setActiveQuestion(questionResult[0]);
        setGameState('question');
    }
  };

  const handleAnswer = (correct: boolean) => {
    if (!duelHook.activeTile) return;

    if (correct) {
      playAudio('/sounds/correct.mp3');
    } else {
      playAudio('/sounds/incorrect.mp3');
    }

    if (gameState === 'question') {
      const tileToConquer = duelHook.activeTile;
      setTimeout(() => endTurn(correct, 'player', tileToConquer), 1500);
      return;
    }

    if (gameState === 'duel') {
      duelHook.handleAnswer(correct);
    }
  };
  
  const handleModalClose = () => {
    if (!duelHook.activeTile) return;
    if (gameState === 'question') {
      endTurn(false, 'player', duelHook.activeTile);
    }
    if (gameState === 'duel') {
      duelHook.handleModalClose();
    }
  };

  const resetGame = () => {
    setGameState('setup');
    setBoard([]);
    setScores({ player: 0, ai: 0 });
    setTurn('player');
    setWinner(null);
    duelHook.resetDuel();
  };

  return {
    gameState,
    setGameState,
    board,
    setBoard,
    scores,
    setScores,
    turn,
    setTurn,
    activeTile: duelHook.activeTile,
    setActiveTile: duelHook.setActiveTile,
    activeQuestion: duelHook.activeQuestion,
    setActiveQuestion: duelHook.setActiveQuestion,
    duel: duelHook.duel,
    setDuel: duelHook.setDuel,
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
    endDuel: duelHook.resetDuel,
    resetGame,
  };
}
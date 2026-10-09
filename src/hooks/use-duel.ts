'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { DuelState, Question, Player, GameDifficulty, TileData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAudio } from '@/hooks/use-audio';

const DUEL_TIME_PER_QUESTION = 15;
const MIN_DUEL_QUESTIONS = 5;

const AI_ACCURACY: Record<GameDifficulty, number> = {
  easy: 0.45,
  medium: 0.60,
  hard: 0.75,
  epic: 0.90,
};

interface UseDuelOptions {
  difficulty: GameDifficulty;
  language: string;
  onEndDuel: (finalDuelState: DuelState, duelTile: TileData) => void;
  onEndTurn: (wasTurnSuccessful: boolean, currentTurnPlayer: Player, tileConquered: TileData | null) => void;
  generateQuestions: (theme: string, language: string, count: number) => Promise<Question[] | { error: string }>;
  getBoard: () => TileData[];
}

interface UseDuelReturn {
  duel: DuelState | null;
  setDuel: (duel: DuelState | null) => void;
  activeQuestion: Question | null;
  setActiveQuestion: (question: Question | null) => void;
  activeTile: TileData | null;
  setActiveTile: (tile: TileData | null) => void;
  startDuel: (tile: TileData, challenger: Player) => Promise<void>;
  handleAnswer: (correct: boolean) => void;
  handleModalClose: () => void;
  resetDuel: () => void;
}

export function useDuel({
  difficulty,
  language,
  onEndDuel,
  onEndTurn,
  generateQuestions,
  getBoard,
}: UseDuelOptions): UseDuelReturn {
  const [duel, setDuel] = useState<DuelState | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [activeTile, setActiveTile] = useState<TileData | null>(null);

  const { toast } = useToast();
  const { playAudio } = useAudio();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      onEndDuel(finalDuelState, duelTile);
    }, 1500);
  }, [onEndDuel, toast]);

  const startDuel = async (tile: TileData, challenger: Player) => {
    playAudio('/sounds/duel.mp3');
    const board = getBoard();
    const territoryCount = board.filter(t => t.owner === (challenger === 'player' ? 'ai' : 'player') && t.theme === tile.theme).length;
    const questionCount = Math.max(MIN_DUEL_QUESTIONS, territoryCount);

    const questionResult = await generateQuestions(tile.theme, language, questionCount);

    if ('error' in questionResult) {
      toast({
        title: 'Falha ao obter perguntas do duelo',
        description: questionResult.error,
        variant: 'destructive',
      });
      return;
    }

    const totalDuelTime = DUEL_TIME_PER_QUESTION * questionResult.length;
    setActiveTile(tile);
    setActiveQuestion(questionResult[0]);
    setDuel({
      challenger,
      questions: questionResult,
      activeQuestionIndex: 0,
      playerCorrect: 0,
      aiCorrect: 0,
      timeRemaining: totalDuelTime,
    });
  };

  const handleAnswer = (correct: boolean) => {
    if (!duel || !activeTile) return;

    if (correct) {
      playAudio('/sounds/correct.mp3');
    } else {
      playAudio('/sounds/incorrect.mp3');
    }

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
      setDuel(updatedDuelState);
      endDuel(updatedDuelState, activeTile);
    }
  };

  const handleModalClose = () => {
    if (!activeTile || !duel) return;
    if (timerRef.current) clearInterval(timerRef.current);
    endDuel(duel, activeTile);
  };

  const resetDuel = () => {
    setDuel(null);
    setActiveQuestion(null);
    setActiveTile(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (duel && duel.timeRemaining > 0) {
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
  }, [duel]);

  useEffect(() => {
    if (duel && duel.timeRemaining === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      toast({
        title: "O tempo acabou!",
        description: "O desafiante perdeu o duelo.",
        variant: "destructive",
      });
      if (activeTile) {
        endDuel(duel, activeTile);
      }
    }
  }, [duel, activeTile, endDuel, toast]);

  return {
    duel,
    setDuel,
    activeQuestion,
    setActiveQuestion,
    activeTile,
    setActiveTile,
    startDuel,
    handleAnswer,
    handleModalClose,
    resetDuel,
  };
}
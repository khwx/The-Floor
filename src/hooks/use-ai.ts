'use client';

import { useCallback, useRef, useEffect } from 'react';
import type { TileData, GameDifficulty, Player, SinglePlayerGameState } from '@/lib/types';
import { getNeighbors } from '@/lib/grid';

const MIN_DUEL_QUESTIONS = 5;
const DUEL_TIME_PER_QUESTION = 15;

const AI_ACCURACY: Record<GameDifficulty, number> = {
  easy: 0.45,
  medium: 0.60,
  hard: 0.75,
  epic: 0.90,
};

interface UseAIOptions {
  board: TileData[];
  gridSize: { rows: number; cols: number };
  difficulty: GameDifficulty;
  language: string;
  turn: Player;
  gameState: SinglePlayerGameState;
  generateQuestion: (theme: string, language: string, count: number) => Promise<any>;
  playAudio: (path: string) => void;
  toast: (options: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;
  setActiveTile: (tile: TileData | null) => void;
  setActiveQuestion: (question: any) => void;
  setDuel: (duel: any) => void;
  setGameState: (state: SinglePlayerGameState) => void;
  setAiAction: (action: string) => void;
  setTurn: (turn: Player) => void;
  endTurn: (wasTurnSuccessful: boolean, currentTurnPlayer: Player, tileConquered: TileData | null) => void;
}

export function useAI({
  board,
  gridSize,
  difficulty,
  language,
  turn,
  gameState,
  generateQuestion,
  playAudio,
  toast,
  setActiveTile,
  setActiveQuestion,
  setDuel,
  setGameState,
  setAiAction,
  setTurn,
  endTurn,
}: UseAIOptions) {
  const phase1TimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const phase3TimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const t = useCallback((key: string, lang: string, params?: Record<string, string | number>) => {
    const uiTranslations: Record<string, Record<string, string>> = {
      analyzingBoard: {
        Portuguese: 'A analisar o tabuleiro...',
        English: 'Analyzing the board...',
        Spanish: 'Analizando el tablero...',
        French: 'Analyse du plateau...',
        German: 'Das Spielfeld analysieren...',
      },
      preparingChallenge: {
        Portuguese: 'A preparar desafio em "{theme}"...',
        English: 'Preparing challenge in "{theme}"...',
        Spanish: 'Preparando desafío en "{theme}"...',
        French: 'Préparation du défi dans "{theme}"...',
        German: 'Herausforderung in "{theme}" vorbereiten...',
      },
      attacking: {
        Portuguese: 'A atacar "{theme}"...',
        English: 'Attacking "{theme}"...',
        Spanish: 'Atacando "{theme}"...',
        French: 'Attaque de "{theme}"...',
        German: '"{theme}" angreifen...',
      },
      aiTurnChallenge: {
        Portuguese: 'Turno da IA: Desafio!',
        English: "AI's Turn: Challenge!",
        Spanish: '¡Turno de la IA: Desafío!',
        French: "Tour de l'IA : Défi !",
        German: 'KI-Zug: Herausforderung!',
      },
      aiChallengesTerritory: {
        Portuguese: 'A IA desafia o seu território de "{theme}". Prepare-se para um duelo de {count} perguntas!',
        English: 'The AI challenges your "{theme}" territory. Prepare for a duel of {count} questions!',
        Spanish: '¡La IA desafía tu territorio de "{theme}"! ¡Prepárate para un duelo de {count} preguntas!',
        French: "L'IA défie votre territoire de \"{theme}\". Préparez-vous pour un duel de {count} questions !",
        German: 'Die KI fordert dein "{theme}"-Gebiet heraus. Bereite dich auf ein Duell mit {count} Fragen vor!',
      },
      aiTurn: {
        Portuguese: 'Turno da IA',
        English: "AI's Turn",
        Spanish: 'Turno de la IA',
        French: "Tour de l'IA",
        German: 'KI-Zug',
      },
      aiAttacksNeutral: {
        Portuguese: 'A IA tenta conquistar o território neutro de "{theme}".',
        English: 'The AI attempts to conquer the neutral "{theme}" territory.',
        Spanish: 'La IA intenta conquistar el territorio neutral de "{theme}".',
        French: "L'IA tente de conquérir le territoire neutre de \"{theme}\".",
        German: 'Die KI versucht, das neutrale "{theme}"-Gebiet zu erobern.',
      },
      aiAnswered: {
        Portuguese: 'A IA respondeu {correct}!',
        English: 'The AI answered {correct}!',
        Spanish: '¡La IA respondió {correct}!',
        French: "L'IA a répondu {correct} !",
        German: 'Die KI hat {correct} geantwortet!',
      },
      correctly: {
        Portuguese: 'corretamente',
        English: 'correctly',
        Spanish: 'correctamente',
        French: 'correctement',
        German: 'richtig',
      },
      incorrectly: {
        Portuguese: 'incorretamente',
        English: 'incorrectly',
        Spanish: 'incorrectamente',
        French: 'incorrectement',
        German: 'falsch',
      },
      aiThinking: {
        Portuguese: 'A IA está a pensar...',
        English: 'The AI is thinking...',
        Spanish: 'La IA está pensando...',
        French: "L'IA réfléchit...",
        German: 'Die KI denkt nach...',
      },
    };

    const translations = uiTranslations[key];
    if (!translations) return key;
    let message = translations[lang as keyof typeof translations] || translations.Portuguese;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        message = message.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return message;
  }, []);

  useEffect(() => {
    if (gameState !== 'ai_turn' || turn !== 'ai' || board.length === 0) return;

    setAiAction(t('analyzingBoard', language));
    
    phase1TimeoutRef.current = setTimeout(() => {
      const { rows, cols } = gridSize;
      const aiTiles = board.filter(t => t.owner === 'ai');
      let duelTargets: {tile: TileData, territorySize: number}[] = [];
      let unownedTargets: TileData[] = [];

      for (const aiTile of aiTiles) {
          const neighbors = getNeighbors(aiTile.id, cols, rows);
          for (const neighborId of neighbors) {
              const neighborTile = board[neighborId];
              if (neighborTile.owner === 'player' && !duelTargets.some(t => t.tile.theme === neighborTile.theme)) {
                  const territorySize = board.filter(t => t.owner === 'player' && t.theme === neighborTile.theme).length;
                  duelTargets.push({ tile: neighborTile, territorySize });
              } else if (neighborTile.owner === 'unowned' && !unownedTargets.some(t => t.id === neighborId)) {
                  unownedTargets.push(neighborTile);
              }
          }
      }
      
      let targetTile: TileData | null = null;
      if (duelTargets.length > 0) {
          duelTargets.sort((a, b) => b.territorySize - a.territorySize);
          targetTile = duelTargets[0].tile;
      } else if (unownedTargets.length > 0) {
          targetTile = unownedTargets[Math.floor(Math.random() * unownedTargets.length)];
      }
      
      if (!targetTile) {
         setTurn('player');
         setGameState('playing');
         setAiAction('');
         return;
      }

      const isDuel = targetTile.owner === 'player';
      const theme = targetTile.theme;
      
      setAiAction(isDuel 
        ? t('preparingChallenge', language, { theme }) 
        : t('attacking', language, { theme }));

      phase3TimeoutRef.current = setTimeout(async () => {
        if (isDuel) {
            playAudio('/sounds/duel.mp3');
            const territoryCount = board.filter(t => t.owner === 'player' && t.theme === theme).length;
            const numQuestions = Math.max(MIN_DUEL_QUESTIONS, territoryCount);

            toast({
                title: t('aiTurnChallenge', language),
                description: t('aiChallengesTerritory', language, { theme, count: numQuestions }),
            });
            
            const questionResult = await generateQuestion(theme, language, numQuestions);
            if ('error' in questionResult) {
                toast({
                    title: 'Erro ao gerar perguntas do duelo',
                    description: questionResult.error,
                    variant: 'destructive',
                });
                setTurn('player');
                setGameState('playing');
                setAiAction('');
                return;
            }

            const totalDuelTime = 15 * questionResult.length;
            setActiveTile(targetTile);
            setActiveQuestion(questionResult[0]);
            setDuel({
                challenger: 'ai',
                questions: questionResult,
                activeQuestionIndex: 0,
                playerCorrect: 0,
                aiCorrect: 0,
                timeRemaining: totalDuelTime,
            });
            setGameState('duel');
            setAiAction('');
        } else {
            toast({
                title: t('aiTurn', language),
                description: t('aiAttacksNeutral', language, { theme }),
            });
            const isCorrect = Math.random() < AI_ACCURACY[difficulty];
            setTimeout(() => {
                if (isCorrect) playAudio('/sounds/correct.mp3');
                else playAudio('/sounds/incorrect.mp3');
                toast({
                    title: t('aiAnswered', language, { correct: isCorrect ? t('correctly', language) : t('incorrectly', language) }),
                    description: '',
                    variant: isCorrect ? 'default' : 'destructive'
                });
                setTimeout(() => endTurn(isCorrect, 'ai', targetTile!), 1500);
            }, 2000);
            setAiAction('');
        }
      }, 1000);
      
      return () => {
        if (phase3TimeoutRef.current) clearTimeout(phase3TimeoutRef.current);
      };
    }, 800);
    
    return () => {
      if (phase1TimeoutRef.current) clearTimeout(phase1TimeoutRef.current);
      setAiAction('');
    };
  }, [gameState, turn, board, gridSize, endTurn, toast, playAudio, difficulty, language, generateQuestion, setActiveTile, setActiveQuestion, setDuel, setGameState, setAiAction, setTurn, t]);
}
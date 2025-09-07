'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateFloor, generateQuestion } from '@/lib/actions';
import type { GameDifficulty, Player, Territory, Question, DuelState } from '@/lib/types';
import { GameSetup } from '@/components/game-setup';
import { GameBoard } from '@/components/game-board';
import { Scoreboard } from '@/components/scoreboard';
import { QuestionModal } from '@/components/question-modal';
import { GameOverDialog } from '@/components/game-over-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAudio } from '@/hooks/use-audio';

type GameState = 'setup' | 'loading_board' | 'playing' | 'fetching_question' | 'question' | 'duel' | 'finished';

type TileData = {
  id: number;
  theme: string;
  owner: Player | 'unowned';
};

const DUEL_TIME_PER_QUESTION = 15; // More time for humans
const MIN_DUEL_QUESTIONS = 5;

const getGridSize = (territoryCount: number): { rows: number, cols: number } => {
  if (territoryCount <= 0) return { rows: 0, cols: 0 };
  const sqrt = Math.sqrt(territoryCount);
  if (Number.isInteger(sqrt)) {
    return { rows: sqrt, cols: sqrt };
  }
  
  let cols = Math.ceil(sqrt);
  while (territoryCount % cols !== 0 && cols < territoryCount) {
    cols++;
  }
  
  if (territoryCount % cols !== 0) {
      return { rows: 1, cols: territoryCount };
  }
  
  const rows = territoryCount / cols;
  return { rows, cols };
};


export default function MultiplayerPage() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [board, setBoard] = useState<TileData[]>([]);
  const [language, setLanguage] = useState('English');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [turn, setTurn] = useState<Player>('player1');
  const [activeTile, setActiveTile] = useState<TileData | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [duel, setDuel] = useState<DuelState | null>(null);

  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playAudio = useAudio();

  const checkEndGame = useCallback((newBoard: TileData[]) => {
    const player1Score = newBoard.filter(tile => tile.owner === 'player1').length;
    const player2Score = newBoard.filter(tile => tile.owner === 'player2').length;

    if (player1Score === 0 || player2Score === 0 || player1Score + player2Score === newBoard.length) {
       if (player1Score > player2Score) setWinner('player1');
      else if (player2Score > player1Score) setWinner('player2');
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
      const loserOfTurn = winnerOfTurn === 'player1' ? 'player2' : 'player1';
      
      if (tileConquered.owner !== winnerOfTurn) {
        tileWasConquered = true;
        
        if (tileConquered.owner === loserOfTurn) {
            const conqueredTheme = tileConquered.theme;
            newBoard = newBoard.map(t => {
              if (t.owner === loserOfTurn && t.theme === conqueredTheme) {
                return { ...t, owner: winnerOfTurn };
              }
              return t;
            });
        } else if (tileConquered.owner === 'unowned') {
            newBoard = newBoard.map(t =>
              t.id === tileConquered.id ? { ...t, owner: winnerOfTurn } : t
            );
        }
      }
    }

    const newScores = {
      player1: newBoard.filter(t => t.owner === 'player1').length,
      player2: newBoard.filter(t => t.owner === 'player2').length,
    };
    
    setScores(newScores as { player: number; ai: number; } | { player1: number; player2: number; });
    setBoard(newBoard);
    
    setActiveTile(null);
    setActiveQuestion(null);
    setDuel(null);
    if(timerRef.current) clearInterval(timerRef.current);

    if (checkEndGame(newBoard)) {
      return;
    }
    
    if (tileWasConquered) {
      setGameState('playing');
    } else {
      const nextTurn = currentTurnPlayer === 'player1' ? 'player2' : 'player1';
      setTurn(nextTurn);
      setGameState('playing');
      toast({ title: `Agora é a vez do ${nextTurn === 'player1' ? 'Jogador 1' : 'Jogador 2'}!`});
    }
  }, [board, checkEndGame, playAudio, toast]);

  const endDuel = useCallback((finalDuelState: DuelState, duelTile: TileData) => {
    const p1Correct = finalDuelState.challenger === 'player1' ? finalDuelState.playerCorrect : finalDuelState.aiCorrect;
    const p2Correct = finalDuelState.challenger === 'player2' ? finalDuelState.playerCorrect : finalDuelState.aiCorrect;
    
    let wasTurnSuccessful = p1Correct > p2Correct;
    if(finalDuelState.challenger === 'player2') wasTurnSuccessful = p2Correct > p1Correct;
    
    toast({
      title: 'Duelo Terminado!',
      description: wasTurnSuccessful
        ? `O desafiante (${finalDuelState.challenger}) venceu o duelo!`
        : `O defensor (${finalDuelState.challenger === 'player1' ? 'player2' : 'player1'}) venceu o duelo!`,
    });

    setTimeout(() => {
      endTurn(wasTurnSuccessful, finalDuelState.challenger, duelTile);
    }, 1500);
  }, [endTurn, toast]);

  const handleGameStart = useCallback(async (diff: GameDifficulty, lang: string, startPlayer: Player) => {
    setGameState('loading_board');
    setLanguage(lang);
    setDifficulty(diff);
    setTurn(startPlayer);
    
    localStorage.setItem('tile-takeover-difficulty-multiplayer', diff);
    localStorage.setItem('tile-takeover-language-multiplayer', lang);

    const result = await generateFloor(diff, lang);
    if ('error' in result) {
      toast({
        title: 'Erro a criar o tabuleiro',
        description: result.error,
        variant: 'destructive',
      });
      setGameState('setup');
      return;
    }
    
    const { territories } = result;
    const { rows, cols } = getGridSize(territories.length);

    const initialBoard: TileData[] = territories.map((t: Territory, i: number) => ({
      id: i,
      theme: t.theme,
      owner: 'unowned',
    }));

    initialBoard[0].owner = 'player1';
    initialBoard[initialBoard.length - 1].owner = 'player2';

    setGridSize({ rows, cols });
    setBoard(initialBoard);
    setScores({ player1: 1, player2: 1 });
    setGameState('playing');
  }, [toast]);
  

  const handleTileClick = async (tile: TileData) => {
    if (gameState !== 'playing' || tile.owner === turn) return;

    setActiveTile(tile);
    setGameState('fetching_question');

    const isDuel = tile.owner !== 'unowned';
    const questionTheme = tile.theme;
    const opponent = turn === 'player1' ? 'player2' : 'player1';

    let questionCount = 1;
    if (isDuel) {
      playAudio('/sounds/duel.mp3');
      const territoryCount = board.filter(t => t.owner === opponent && t.theme === questionTheme).length;
      questionCount = Math.max(MIN_DUEL_QUESTIONS, territoryCount);
    }
    
    toast({
        title: `A preparar o desafio do ${turn === 'player1' ? 'Jogador 1' : 'Jogador 2'}...`,
        description: `A gerar ${questionCount} pergunta(s) sobre "${questionTheme}".`,
    });

    const questionResult = await generateQuestion(questionTheme, language, questionCount);

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
    
    setActiveQuestion(questionResult[0]);

    if (isDuel) {
        const totalDuelTime = DUEL_TIME_PER_QUESTION * questionResult.length;
        toast({
            title: `Duelo Iniciado!`,
            description: `Tema: "${questionTheme}". Você tem ${totalDuelTime} segundos para responder a ${questionResult.length} pergunta(s).`,
        });
        
        setDuel({
            challenger: turn,
            questions: questionResult,
            activeQuestionIndex: 0,
            playerCorrect: 0, // Challenger's score
            aiCorrect: 0, // Defender's score
            timeRemaining: totalDuelTime,
        });
        
        setGameState('duel');
    } else { 
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
      setTimeout(() => endTurn(correct, turn, tileToConquer), 1500);
      return;
    }

    if (gameState === 'duel' && duel) {
        const isChallengerTurn = (duel.activeQuestionIndex % 2 === 0);
        const currentQuestionPlayer = isChallengerTurn ? duel.challenger : (duel.challenger === 'player1' ? 'player2' : 'player1');
        
        toast({
            title: `Resposta do ${currentQuestionPlayer === 'player1' ? 'Jogador 1' : 'Jogador 2'}`,
            description: `A resposta foi ${correct ? 'correta' : 'incorreta'}!`,
        });
        
        const newPlayerCorrect = duel.playerCorrect + (isChallengerTurn && correct ? 1 : 0);
        const newDefenderCorrect = duel.aiCorrect + (!isChallengerTurn && correct ? 1 : 0);
        
        const nextQuestionIndex = duel.activeQuestionIndex + 1;
      
        const updatedDuelState: DuelState = {
            ...duel,
            playerCorrect: newPlayerCorrect,
            aiCorrect: newDefenderCorrect,
        };

        setDuel(updatedDuelState);

      if (nextQuestionIndex < duel.questions.length) {
        setTimeout(() => {
            const nextPlayer = (nextQuestionIndex % 2 === 0) ? duel.challenger : (duel.challenger === 'player1' ? 'player2' : 'player1');
            toast({ title: `Próxima Pergunta`, description: `É a vez do ${nextPlayer === 'player1' ? 'Jogador 1' : 'Jogador 2'}.`})
            setDuel({
              ...updatedDuelState,
              activeQuestionIndex: nextQuestionIndex,
            });
            setActiveQuestion(duel.questions[nextQuestionIndex]);
        }, 1500);
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        const tileToConquer = activeTile;
        endDuel(updatedDuelState, tileToConquer);
      }
    }
  };
  
  const handleModalClose = () => {
    if (!activeTile) return;
    if (gameState === 'question') {
      endTurn(false, turn, activeTile);
    }
    if (gameState === 'duel' && duel) {
      const wasTurnSuccessful = duel.challenger !== turn;
      endTurn(wasTurnSuccessful, duel.challenger, activeTile);
    }
  };

  const resetGame = () => {
    setGameState('setup');
    setBoard([]);
    setScores({ player1: 0, player2: 0 });
    setTurn('player1');
    setWinner(null);
    setActiveTile(null);
    setActiveQuestion(null);
    setDuel(null);
  };
  
  
  const startDuelTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
        setDuel(prevDuel => {
          if (!prevDuel || !activeTile) {
             if (timerRef.current) clearInterval(timerRef.current);
             return null;
          }

          if (prevDuel.timeRemaining > 1) {
            return { ...prevDuel, timeRemaining: prevDuel.timeRemaining - 1 };
          }
          
          if (timerRef.current) clearInterval(timerRef.current);
          toast({
            title: "O tempo acabou!",
            description: "O duelo terminou por tempo.",
            variant: "destructive",
          });
          
          endDuel(prevDuel, activeTile);

          return { ...prevDuel, timeRemaining: 0 };
        });
      }, 1000);
  }, [toast, endDuel, activeTile]);


  useEffect(() => {
    if (gameState === 'duel' && duel && duel.timeRemaining > 0) {
      startDuelTimer();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, duel, startDuelTimer]);


  if (gameState === 'setup') {
    return <GameSetup onStart={handleGameStart} lastDifficulty={difficulty} lastLanguage={language} mode="multiplayer" />;
  }
  
  if (gameState === 'loading_board') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">A gerar o vosso campo de batalha...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl">
        <header className="flex justify-between items-center mb-4">
          <Link href="/" passHref>
            <Button variant="outline">Voltar ao Menu</Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary hidden sm:block">Tile Takeover</h1>
          <Scoreboard scores={scores} turn={turn} />
        </header>

        <main className="relative">
          <GameBoard
            board={board}
            gridSize={gridSize}
            onTileClick={handleTileClick}
            playerTurn={gameState === 'playing'}
            currentPlayer={turn}
          />
          {gameState === 'fetching_question' && (
            <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center z-10 rounded-lg pointer-events-none">
                 <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}
        </main>
      </div>

      <QuestionModal
        isOpen={gameState === 'question' || gameState === 'duel'}
        tile={activeTile}
        question={activeQuestion}
        onAnswer={handleAnswer}
        onClose={handleModalClose}
        duel={duel}
        currentPlayer={turn}
      />
      <GameOverDialog
        isOpen={gameState === 'finished'}
        winner={winner}
        scores={scores}
        onPlayAgain={resetGame}
      />
    </div>
  );
}

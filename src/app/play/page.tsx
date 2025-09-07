'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateFloor, generateQuestion } from '@/lib/actions';
import type { GameDifficulty, TileData, Player, Territory, Question, DuelState } from '@/lib/types';
import { GameSetup } from '@/components/game-setup';
import { GameBoard } from '@/components/game-board';
import { Scoreboard } from '@/components/scoreboard';
import { QuestionModal } from '@/components/question-modal';
import { GameOverDialog } from '@/components/game-over-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

type GameState = 'setup' | 'playing' | 'ai_thinking' | 'question' | 'duel' | 'finished';
const DUEL_TIME_PER_QUESTION = 10; // seconds
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
      // Fallback for prime numbers or other tricky numbers
      return { rows: 1, cols: territoryCount };
  }
  
  const rows = territoryCount / cols;
  return { rows, cols };
};


export default function PlayPage() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [board, setBoard] = useState<TileData[]>([]);
  const [language, setLanguage] = useState('English');
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [turn, setTurn] = useState<Player>('player');
  const [activeTile, setActiveTile] = useState<TileData | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [duel, setDuel] = useState<DuelState | null>(null);

  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleGameStart = async (difficulty: GameDifficulty, lang: string) => {
    setGameState('ai_thinking');
    setLanguage(lang);
    const result = await generateFloor(difficulty, lang);
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

    // Assign initial tiles
    initialBoard[0].owner = 'player';
    initialBoard[initialBoard.length - 1].owner = 'ai';

    setGridSize({ rows, cols });
    setBoard(initialBoard);
    setScores({ player: 1, ai: 1 });
    setTurn('player');
    setGameState('playing');
  };

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

  const handleTileClick = async (tile: TileData) => {
    if (gameState !== 'playing' || turn !== 'player') return;

    const isDuel = tile.owner === 'ai';
    const questionTheme = tile.theme;

    setActiveTile(tile);
    setGameState('ai_thinking'); // Show loader while fetching question(s)
    
    const territoryCount = isDuel ? board.filter(t => t.owner === 'ai' && t.theme === questionTheme).length : 1;
    const questionCount = isDuel ? Math.max(MIN_DUEL_QUESTIONS, territoryCount) : 1;
    
    toast({
        title: 'A preparar o seu desafio...',
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
            description: `Tema: "${questionTheme}". Você tem ${totalDuelTime} segundos para responder a ${questionCount} pergunta(s).`,
        });
        setGameState('duel');
        
        setDuel({
            challenger: 'player',
            questions: questionResult,
            activeQuestionIndex: 0,
            playerCorrect: 0,
            aiCorrect: 0,
            timeRemaining: totalDuelTime,
        });

    } else { // Unowned tile
        setGameState('question');
    }
  };
  
  const handleAnswer = (correct: boolean) => {
    if (!activeTile) return;

    // Logic for standard question (unowned tile)
    if (gameState === 'question') {
      endTurn(correct);
      return;
    }

    // Logic for Dueling
    if (gameState === 'duel' && duel) {
      if (timerRef.current) clearInterval(timerRef.current);

      const newPlayerCorrect = duel.playerCorrect + (correct ? 1 : 0);
      const aiResponseCorrect = Math.random() > 0.35; // AI has a 65% chance of being correct
      const newAiCorrect = duel.aiCorrect + (aiResponseCorrect ? 1 : 0);

      const nextQuestionIndex = duel.activeQuestionIndex + 1;
      
      // If there are more questions, show the next one.
      if (nextQuestionIndex < duel.questions.length) {
        setActiveQuestion(duel.questions[nextQuestionIndex]);
        setDuel({ 
          ...duel, 
          activeQuestionIndex: nextQuestionIndex,
          playerCorrect: newPlayerCorrect,
          aiCorrect: newAiCorrect,
        });
        startDuelTimer(); // Restart timer for next question
      } else {
        // This was the last question. End the duel and determine the winner.
        const playerFinalScore = newPlayerCorrect;
        const aiFinalScore = newAiCorrect;
        
        // Challenger wins on more correct answers. Defender (AI) wins on a draw.
        const wasTurnSuccessful = playerFinalScore > aiFinalScore;
        endTurn(wasTurnSuccessful);
      }
    }
  };
  
  const endTurn = (wasTurnSuccessful: boolean) => {
    if (!activeTile) return;
    
    const winnerOfTurn = wasTurnSuccessful ? turn : (turn === 'player' ? 'ai' : 'player');
    
    let newBoard = [...board];
    
    if (wasTurnSuccessful) {
      // Unowned tile conquest
      if (activeTile.owner === 'unowned') {
          newBoard = board.map(t =>
            t.id === activeTile.id ? { ...t, owner: winnerOfTurn } : t
          );
      }
      
      // Duel conquest
      if (activeTile.owner !== 'unowned' && activeTile.owner !== winnerOfTurn) {
        const loserOfDuel = turn === 'player' ? 'ai' : 'player';
        const conqueredTheme = activeTile.theme;
        
        newBoard = board.map(t => {
          // The winner takes all tiles of the conquered theme from the loser
          if (t.owner === loserOfDuel && t.theme === conqueredTheme) {
            return { ...t, owner: winnerOfTurn };
          }
          return t;
        });
      }
    }

    setBoard(newBoard);
    const newScores = {
      player: newBoard.filter(t => t.owner === 'player').length,
      ai: newBoard.filter(t => t.owner === 'ai').length,
    };
    setScores(newScores);
    
    // Clean up state
    setActiveTile(null);
    setActiveQuestion(null);
    setDuel(null);
    if(timerRef.current) clearInterval(timerRef.current);

    if (checkEndGame(newBoard)) {
      return;
    }
    
    setTurn(turn === 'player' ? 'ai' : 'player');
    setGameState('ai_thinking');
  };


  const handleModalClose = () => {
    // Closing the modal during a question or duel is a loss for that turn.
    if (gameState === 'question') {
      endTurn(false);
    }
    if (gameState === 'duel' && duel) {
      // In a duel, prematurely closing means the challenger loses.
      const challengerWon = duel.challenger === 'ai'; // If AI challenged, it wins. If player challenged, they lose.
      endTurn(challengerWon);
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
  
  const getNeighbors = useCallback((tileId: number, cols: number, rows: number) => {
      if (cols === 0 || rows === 0) return [];
      const r = Math.floor(tileId / cols);
      const c = tileId % cols;
      const neighbors = [];
      if (r > 0) neighbors.push(tileId - cols); // top
      if (r < rows - 1) neighbors.push(tileId + cols); // bottom
      if (c > 0) neighbors.push(tileId - 1); // left
      if (c < cols - 1) neighbors.push(tileId + 1); // right
      return neighbors;
  }, []);
  
  const startDuelTimer = () => {
    // The timer is now for the entire duel, not per question.
    // It should only be set once at the start of the duel.
    if (timerRef.current) clearInterval(timerRef.current); // Clear previous timers
    
    timerRef.current = setInterval(() => {
        setDuel(prevDuel => {
          if (prevDuel && prevDuel.timeRemaining > 1) {
            return { ...prevDuel, timeRemaining: prevDuel.timeRemaining - 1 };
          }
          if (timerRef.current) clearInterval(timerRef.current);
          
          // Time's up! Challenger loses.
          if(prevDuel){
            const wasTurnSuccessful = prevDuel.challenger === 'ai'; // AI wins if it was the challenger
            endTurn(wasTurnSuccessful);
          }
          return null; // End of duel
        });
      }, 1000);
  }

  // Duel Timer Logic
  useEffect(() => {
    if (gameState === 'duel' && duel && duel.activeQuestionIndex === 0) {
      startDuelTimer();
    }
    // Cleanup timer if the game state changes away from a duel
    if (gameState !== 'duel' && timerRef.current) {
        clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]); // Only depends on gameState now


  useEffect(() => {
    if (gameState === 'ai_thinking' && turn === 'ai' && board.length > 0) {
      const aiTurn = setTimeout(async () => {
        const { rows, cols } = gridSize;
        const aiTiles = board.filter(t => t.owner === 'ai');
        let possibleTargets: TileData[] = [];

        // Find all unique tiles the AI can attack
        for (const aiTile of aiTiles) {
            const neighbors = getNeighbors(aiTile.id, cols, rows);
            for (const neighborId of neighbors) {
                const neighborTile = board[neighborId];
                if (neighborTile.owner !== 'ai' && !possibleTargets.some(t => t.id === neighborId)) {
                    possibleTargets.push(neighborTile);
                }
            }
        }
        
        if (possibleTargets.length === 0) {
           toast({ title: 'A IA não tem jogadas!', description: 'É a sua vez.' });
           setTurn('player');
           setGameState('playing');
           return;
        }

        // Simple AI: pick a random target
        const targetTile = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
        const isDuel = targetTile.owner === 'player';
        const theme = targetTile.theme;
        
        if (isDuel) {
          // AI challenges player to a duel
          const territoryCount = board.filter(t => t.owner === 'player' && t.theme === theme).length;
          const numQuestions = Math.max(MIN_DUEL_QUESTIONS, territoryCount);

          toast({
              title: `Turno da IA: Desafio!`,
              description: `A IA desafia o seu território de "${theme}". Prepare-se para um duelo de ${numQuestions} perguntas!`,
          });
          
          const questionResult = await generateQuestion(theme, language, numQuestions);

          if ('error' in questionResult) {
              toast({ title: 'Falha ao obter perguntas para o duelo.', variant: 'destructive' });
              setTurn('player');
              setGameState('playing');
              return;
          }
          
          setActiveTile(targetTile);
          setActiveQuestion(questionResult[0]);
          setGameState('duel');
          const totalDuelTime = DUEL_TIME_PER_QUESTION * questionResult.length;
          setDuel({
              challenger: 'ai',
              questions: questionResult,
              activeQuestionIndex: 0,
              playerCorrect: 0,
              aiCorrect: 0,
              timeRemaining: totalDuelTime,
          });

        } else {
          // AI captures an unowned tile
           toast({
              title: `Turno da IA`,
              description: `A IA tenta conquistar o território neutro de "${theme}".`,
          });
          
          const isCorrect = Math.random() > 0.35; // 65% chance to be correct

          setTimeout(() => {
            toast({
                title: `A IA respondeu ${isCorrect ? 'corretamente' : 'incorretamente'}!`,
                variant: isCorrect ? 'default' : 'destructive'
            });
            let newBoard = [...board];
            if (isCorrect) {
                 newBoard = board.map(t =>
                    t.id === targetTile.id ? { ...t, owner: 'ai' } : t
                );
            }
            setBoard(newBoard);
            const newScores = {
              player: newBoard.filter(t => t.owner === 'player').length,
              ai: newBoard.filter(t => t.owner === 'ai').length,
            };
            setScores(newScores);
            if (checkEndGame(newBoard)) return;
            setTurn('player');
            setGameState('playing');
          }, 2000);
        }

      }, 1500);

      return () => clearTimeout(aiTurn);
    }
  }, [gameState, turn, board, gridSize, checkEndGame, toast, language, getNeighbors]);

  if (gameState === 'setup') {
    return <GameSetup onStart={handleGameStart} />;
  }
  
  if (gameState === 'ai_thinking' && board.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">A gerar o seu campo de batalha...</p>
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
            playerTurn={turn === 'player' && gameState === 'playing'}
          />
          {(gameState === 'ai_thinking' && turn === 'ai') && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-xl font-semibold">A IA está a pensar...</p>
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

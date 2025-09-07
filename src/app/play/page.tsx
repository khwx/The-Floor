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
    
    let questionCount = 1;
    if (isDuel) {
      const territoryCount = board.filter(t => t.owner === 'ai' && t.theme === questionTheme).length;
      questionCount = Math.max(MIN_DUEL_QUESTIONS, territoryCount);
    }
    
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
        
        setDuel({
            challenger: 'player',
            questions: questionResult,
            activeQuestionIndex: 0,
            playerCorrect: 0,
            aiCorrect: 0,
            timeRemaining: totalDuelTime,
        });
        
        setGameState('duel');
    } else { // Unowned tile
        setGameState('question');
    }
  };
  
  const endDuel = (finalDuelState: DuelState) => {
    let wasTurnSuccessful: boolean;
    if (finalDuelState.challenger === 'player') {
      // Challenger must have MORE correct answers to win. Tie goes to the defender.
      wasTurnSuccessful = finalDuelState.playerCorrect > finalDuelState.aiCorrect;
    } else { // AI is challenger
      wasTurnSuccessful = finalDuelState.aiCorrect > finalDuelState.playerCorrect;
    }
    
    toast({
      title: 'Duelo Terminado!',
      description: wasTurnSuccessful
        ? `O desafiante (${finalDuelState.challenger}) venceu!`
        : `O defensor (${finalDuelState.challenger === 'player' ? 'ai' : 'player'}) venceu!`,
      variant: wasTurnSuccessful ? 'default' : 'destructive',
    });

    // Use a timeout to let the user see the result of the last question
    setTimeout(() => {
      endTurn(wasTurnSuccessful);
    }, 1500);
  };
  
  const handleAnswer = (correct: boolean) => {
    if (!activeTile) return;

    // Logic for standard question (unowned tile)
    if (gameState === 'question') {
      // Delay to allow user to see feedback in modal
      setTimeout(() => endTurn(correct), 1500);
      return;
    }

    // Logic for Dueling
    if (gameState === 'duel' && duel) {
      const newPlayerCorrect = duel.playerCorrect + (correct ? 1 : 0);
      // Simulate AI response for the same question
      const aiResponseCorrect = Math.random() > 0.35; // AI has a 65% chance of being correct
      const newAiCorrect = duel.aiCorrect + (aiResponseCorrect ? 1 : 0);

      const nextQuestionIndex = duel.activeQuestionIndex + 1;
      
      const updatedDuelState: DuelState = {
          ...duel,
          playerCorrect: newPlayerCorrect,
          aiCorrect: newAiCorrect,
      };

      setDuel(updatedDuelState);

      // If there are more questions, show the next one after a delay
      if (nextQuestionIndex < duel.questions.length) {
        setTimeout(() => {
            setDuel({
              ...updatedDuelState,
              activeQuestionIndex: nextQuestionIndex,
            });
            setActiveQuestion(duel.questions[nextQuestionIndex]);
        }, 1500); // 1.5 second delay to show result and move to next question
      } else {
        // This was the last question. End the duel.
        if (timerRef.current) clearInterval(timerRef.current);
        endDuel(updatedDuelState);
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
    
    const nextTurn = turn === 'player' ? 'ai' : 'player';
    setTurn(nextTurn);
    setGameState(nextTurn === 'ai' ? 'ai_thinking' : 'playing');
  };


  const handleModalClose = () => {
    // Closing the modal during a question is a loss for that turn.
    if (gameState === 'question') {
      endTurn(false);
    }
    // Closing the modal during a duel is a loss for the challenger.
    if (gameState === 'duel' && duel) {
      // Challenger loses if they close the modal.
      const wasTurnSuccessful = duel.challenger !== 'player';
      endTurn(wasTurnSuccessful);
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
  
  const startDuelTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
        setDuel(prevDuel => {
          if (!prevDuel) {
             if (timerRef.current) clearInterval(timerRef.current);
             return null;
          }

          if (prevDuel.timeRemaining > 1) {
            return { ...prevDuel, timeRemaining: prevDuel.timeRemaining - 1 };
          }
          
          // Time's up!
          if (timerRef.current) clearInterval(timerRef.current);
          toast({
            title: "O tempo acabou!",
            description: "O desafiante perdeu o duelo.",
            variant: "destructive",
          });
          
          // Use a new DuelState object for the final calculation
          const finalDuelState: DuelState = {...prevDuel, timeRemaining: 0};
          
          setTimeout(() => endDuel(finalDuelState), 1500);
          
          return { ...prevDuel, timeRemaining: 0 };
        });
      }, 1000);
  }, [toast]);


  // Effect to start duel timer
  useEffect(() => {
    if (gameState === 'duel' && duel && duel.timeRemaining > 0) {
      // Clear any existing timer before starting a new one
      if (timerRef.current) clearInterval(timerRef.current);
      startDuelTimer();
    }
    
    // Cleanup timer if the game state changes away from a duel
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, duel, startDuelTimer]);


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
                if (neighborTile && neighborTile.owner !== 'ai' && !possibleTargets.some(t => t.id === neighborId)) {
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
        
        setActiveTile(targetTile); // Set active tile for AI turn

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
              setActiveTile(null);
              return;
          }
          
          const totalDuelTime = DUEL_TIME_PER_QUESTION * questionResult.length;
          
          const aiDuelState: DuelState = {
              challenger: 'ai',
              questions: questionResult,
              activeQuestionIndex: 0,
              playerCorrect: 0,
              aiCorrect: 0,
              timeRemaining: totalDuelTime,
          };
          
          // Simulate the entire duel for the AI vs Player
          let simulatedDuel = aiDuelState;
          for(let i = 0; i < numQuestions; i++){
            const aiIsCorrect = Math.random() > 0.35; // 65%
            const playerIsCorrect = Math.random() > 0.5; // 50%
            simulatedDuel = {
              ...simulatedDuel,
              aiCorrect: simulatedDuel.aiCorrect + (aiIsCorrect ? 1 : 0),
              playerCorrect: simulatedDuel.playerCorrect + (playerIsCorrect ? 1 : 0),
            }
          }
          
          const aiWon = simulatedDuel.aiCorrect > simulatedDuel.playerCorrect;

          setTimeout(() => {
              toast({
                  title: `Duelo com IA terminado!`,
                  description: `A IA acertou ${simulatedDuel.aiCorrect} e você ${simulatedDuel.playerCorrect}. A IA ${aiWon ? 'venceu' : 'perdeu'}!`,
                  variant: aiWon ? 'destructive' : 'default'
              });
              endTurn(aiWon);
          }, 2000);


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
            endTurn(isCorrect);
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
            <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center z-10 rounded-lg pointer-events-none">
                {/* A animação de loading foi removida para dar lugar a toasts informativos */}
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

    
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
const DUEL_TIME = 45;

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
    
    // For a duel, fetch questions for all tiles of that theme. For unowned, just one.
    const questionCount = isDuel ? board.filter(t => t.owner === 'ai' && t.theme === questionTheme).length : 1;
    
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
        toast({
            title: `Duelo Iniciado!`,
            description: `Você tem ${DUEL_TIME} segundos para conquistar o tema "${questionTheme}" respondendo a ${questionCount} pergunta(s).`,
        });
        setGameState('duel');
        
        setDuel({
            questions: questionResult,
            activeQuestionIndex: 0,
            timeRemaining: DUEL_TIME,
        });

    } else { // Unowned tile
        setGameState('question');
    }
  };
  
  const handleAnswer = (correct: boolean) => {
    if (!activeTile) return;

    if (gameState === 'duel' && duel) {
        if(timerRef.current) clearInterval(timerRef.current);

        if (correct) {
            const nextQuestionIndex = duel.activeQuestionIndex + 1;
            // If there are more questions, show the next one.
            if (nextQuestionIndex < duel.questions.length) {
                setActiveQuestion(duel.questions[nextQuestionIndex]);
                setDuel({ ...duel, activeQuestionIndex: nextQuestionIndex });
                // Restart timer for the next question? For now, we keep a global duel timer.
                // Let's re-engage the main timer.
                startDuelTimer();
                return; // Stay in the duel, don't proceed to board update yet.
            }
            // If it was the last question and it was correct, the player wins the duel.
            // The normal flow will handle the win.
        } else {
            // Incorrect answer ends the duel immediately. Player loses.
            // The normal flow will handle the loss.
        }
    }
    
    const winnerOfTurn = correct ? turn : (turn === 'player' ? 'ai' : 'player');
    
    let newBoard = [...board];
    
    // Unowned tile conquest
    if (activeTile.owner === 'unowned' && winnerOfTurn === turn) {
        newBoard = board.map(t =>
          t.id === activeTile.id ? { ...t, owner: winnerOfTurn } : t
        );
    }
    
    // Duel conquest
    if (activeTile.owner !== 'unowned' && winnerOfTurn === turn) {
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
    // If the modal is closed prematurely, it counts as a loss for the current turn.
    if (gameState === 'question' || gameState === 'duel') {
      handleAnswer(false);
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
    timerRef.current = setInterval(() => {
        setDuel(prevDuel => {
          if (prevDuel && prevDuel.timeRemaining > 1) {
            return { ...prevDuel, timeRemaining: prevDuel.timeRemaining - 1 };
          }
          if (timerRef.current) clearInterval(timerRef.current);
          handleAnswer(false); // Time's up, player loses the duel
          return null; // End of duel
        });
      }, 1000);
  }

  // Duel Timer Logic
  useEffect(() => {
    if (gameState === 'duel' && duel && duel.timeRemaining > 0) {
      startDuelTimer();
    } else if (gameState !== 'duel' && timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);


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
        
        if (possibleTargets.length > 0) {
            // Prioritize attacking player tiles (duels)
            let bestMove = possibleTargets.find(t => t.owner === 'player');
            // If no player tiles to attack, find best unowned tile to capture
            if (!bestMove) {
                const unownedTargets = possibleTargets.filter(t => t.owner === 'unowned');
                 // Simple logic: pick the unowned tile with the most AI neighbors
                 bestMove = unownedTargets.reduce((best, move) => {
                    const bestNeighbors = getNeighbors(best.id, cols, rows).filter(nId => board[nId].owner === 'ai').length;
                    const moveNeighbors = getNeighbors(move.id, cols, rows).filter(nId => board[nId].owner === 'ai').length;
                    return moveNeighbors > bestNeighbors ? move : best;
                }, unownedTargets[0]);
            }
            if (!bestMove) { 
                 toast({ title: 'A IA não tem jogadas!', description: 'É a sua vez.' });
                 setTurn('player');
                 setGameState('playing');
                 return;
            }

          const isDuel = bestMove.owner === 'player';
          const theme = bestMove.theme;
          
          let toastDescription;
          if(isDuel) {
            const numQuestions = board.filter(t => t.owner === 'player' && t.theme === theme).length;
            toastDescription = `A IA desafia o seu território de "${theme}" e precisa de responder a ${numQuestions} pergunta(s).`;
          } else {
            toastDescription = `A IA tenta conquistar o território neutro de "${theme}".`;
          }
          
          toast({
              title: `Turno da IA: Desafio!`,
              description: toastDescription,
          });
          
          // AI has a 65% chance of being correct for EACH question.
          const isCorrect = Math.random() > 0.35; 

          // Wait a bit to simulate the AI "answering" the question
          setTimeout(() => {
            const winnerOfTurn = isCorrect ? 'ai' : 'player';
            
            toast({
                title: `A IA respondeu ${isCorrect ? 'corretamente' : 'incorretamente'}!`,
                description: `O vencedor do turno é ${winnerOfTurn === 'ai' ? 'a IA' : 'você'}.`,
                variant: isCorrect ? 'default' : 'destructive'
            });
            
            let newBoard = [...board];

            if (isCorrect) {
                if (isDuel) { // AI wins duel
                    const conqueredTheme = bestMove!.theme;
                    newBoard = board.map(t => {
                        if (t.owner === 'player' && t.theme === conqueredTheme) {
                        return { ...t, owner: 'ai' };
                        }
                        return t;
                    });
                } else { // AI wins unowned tile
                    newBoard = board.map(t =>
                        t.id === bestMove!.id ? { ...t, owner: 'ai' } : t
                    );
                }
            }
            // If AI is incorrect, board state doesn't change, player keeps their tiles.
            
            setBoard(newBoard);
            const newScores = {
              player: newBoard.filter(t => t.owner === 'player').length,
              ai: newBoard.filter(t => t.owner === 'ai').length,
            };
            setScores(newScores);
            
            if (checkEndGame(newBoard)) return;
            
            setTurn('player');
            setGameState('playing');
          }, 2500);

        } else {
          toast({ title: 'A IA não tem jogadas!', description: 'É a sua vez.' });
          setTurn('player');
          setGameState('playing');
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateFloor, generateQuestion } from '@/lib/actions';
import type { GameDifficulty, TileData, Player, Territory, Question } from '@/lib/types';
import { GameSetup } from '@/components/game-setup';
import { GameBoard } from '@/components/game-board';
import { Scoreboard } from '@/components/scoreboard';
import { QuestionModal } from '@/components/question-modal';
import { GameOverDialog } from '@/components/game-over-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

type GameState = 'setup' | 'playing' | 'ai_thinking' | 'question' | 'finished';

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


export default function PlayPage() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [board, setBoard] = useState<TileData[]>([]);
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [turn, setTurn] = useState<Player>('player');
  const [activeTile, setActiveTile] = useState<TileData | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);

  const { toast } = useToast();

  const handleGameStart = async (difficulty: GameDifficulty) => {
    setGameState('ai_thinking');
    const result = await generateFloor(difficulty);
    if ('error' in result) {
      toast({
        title: 'Error',
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
    const unownedTiles = newBoard.filter(tile => tile.owner === 'unowned').length;
    if (unownedTiles === 0) {
      const playerScore = newBoard.filter(tile => tile.owner === 'player').length;
      const aiScore = newBoard.filter(tile => tile.owner === 'ai').length;
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
    setActiveTile(tile);
    setGameState('ai_thinking'); // Use ai_thinking as a loading state
    const questionResult = await generateQuestion(tile.theme);
    if ('error' in questionResult) {
      toast({
        title: 'Failed to get question',
        description: questionResult.error,
        variant: 'destructive',
      });
      setGameState('playing');
      setActiveTile(null);
      return;
    }
    setActiveQuestion(questionResult);
    setGameState('question');
  };

  const handleAnswer = (correct: boolean) => {
    if (!activeTile) return;

    if (correct) {
      const newBoard = board.map(t =>
        t.id === activeTile.id ? { ...t, owner: turn } : t
      );
      setBoard(newBoard);
      const newScores = {
        player: newBoard.filter(t => t.owner === 'player').length,
        ai: newBoard.filter(t => t.owner === 'ai').length,
      };
      setScores(newScores);
      if (checkEndGame(newBoard)) {
        setActiveTile(null);
        setActiveQuestion(null);
        return;
      }
    }

    setActiveTile(null);
    setActiveQuestion(null);
    setTurn(turn === 'player' ? 'ai' : 'player');
    setGameState('ai_thinking');
  };

  const handleModalClose = () => {
    // Player closes modal without answering, counts as wrong answer
    if (gameState === 'question') {
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
  };
  
  useEffect(() => {
    if (gameState === 'ai_thinking' && turn === 'ai' && board.length > 0) {
      const aiTurn = setTimeout(() => {
        const aiTiles = board.filter(t => t.owner === 'ai');
        const validMoves: TileData[] = [];
        const { cols } = gridSize;

        aiTiles.forEach(aiTile => {
          const {id} = aiTile;
          const r = Math.floor(id / cols);
          
          const neighbors = [id - cols, id + cols, id - 1, id + 1];

          neighbors.forEach(nId => {
            const nRow = Math.floor(nId / cols);
            if (nId >= 0 && nId < board.length && (nRow === r || Math.abs(id - nId) === cols)) {
               const neighborTile = board[nId];
               if (neighborTile.owner === 'unowned' && !validMoves.find(m => m.id === nId)) {
                validMoves.push(neighborTile);
              }
            }
          });
        });

        if (validMoves.length > 0) {
          const move = validMoves[Math.floor(Math.random() * validMoves.length)];
          const isCorrect = Math.random() > 0.25; // AI has 75% chance
          
          toast({
              title: `AI challenges "${move.theme}"`,
              description: isCorrect ? 'AI answered correctly!' : 'AI failed the challenge.',
          });
          
          setTimeout(() => {
            if (isCorrect) {
              const newBoard = board.map(t => t.id === move.id ? { ...t, owner: 'ai' } : t);
              setBoard(newBoard);
              const newScores = {
                player: newBoard.filter(t => t.owner === 'player').length,
                ai: newBoard.filter(t => t.owner === 'ai').length,
              };
              setScores(newScores);
              if (checkEndGame(newBoard)) return;
            }
            setTurn('player');
            setGameState('playing');
          }, 1000);

        } else {
          toast({ title: 'AI has no moves!', description: 'Your turn.' });
          setTurn('player');
          setGameState('playing');
        }
      }, 1500);

      return () => clearTimeout(aiTurn);
    }
  }, [gameState, turn, board, gridSize, checkEndGame, toast]);

  if (gameState === 'setup') {
    return <GameSetup onStart={handleGameStart} />;
  }
  
  if (gameState === 'ai_thinking' && board.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Generating your battlefield...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl">
        <header className="flex justify-between items-center mb-4">
          <Link href="/" passHref>
            <Button variant="outline">Back to Menu</Button>
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
                <p className="mt-4 text-xl font-semibold">AI is thinking...</p>
            </div>
          )}
        </main>
      </div>

      <QuestionModal
        isOpen={gameState === 'question' || (gameState === 'ai_thinking' && activeTile !== null)}
        tile={activeTile}
        question={activeQuestion}
        onAnswer={handleAnswer}
        onClose={handleModalClose}
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

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
  const [language, setLanguage] = useState('English');
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [turn, setTurn] = useState<Player>('player');
  const [activeTile, setActiveTile] = useState<TileData | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [defendingTile, setDefendingTile] = useState<TileData | null>(null);

  const { toast } = useToast();

  const handleGameStart = async (difficulty: GameDifficulty, lang: string) => {
    setGameState('ai_thinking');
    setLanguage(lang);
    const result = await generateFloor(difficulty, lang);
    if ('error' in result) {
      toast({
        title: 'Erro',
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

    const questionTheme = tile.theme;
    
    if (tile.owner === 'ai') {
        setDefendingTile(tile);
        toast({
            title: `Duelo iniciado!`,
            description: `Você desafia a IA. A pergunta será sobre o tema do território dela: "${questionTheme}".`,
        });
    } else {
        setDefendingTile(null); // Challenging an unowned tile
    }

    setActiveTile(tile);
    setGameState('ai_thinking');
    const questionResult = await generateQuestion(questionTheme, language);
    
    if ('error' in questionResult) {
        toast({
            title: 'Falha ao obter pergunta',
            description: questionResult.error,
            variant: 'destructive',
        });
        setGameState('playing');
        setActiveTile(null);
        setDefendingTile(null);
        return;
    }
    
    const imageUrl = `https://images.unsplash.com/search/photos?query=${encodeURIComponent(questionResult.imageQuery)}`;
    
    setActiveQuestion({...questionResult, imageUrl});
    setGameState('question');
  };
  
  const handleAnswer = (correct: boolean) => {
    if (!activeTile) return;

    const winnerOfDuel = correct ? turn : (turn === 'player' ? 'ai' : 'player');
    const loserOfDuel = winnerOfDuel === 'player' ? 'ai' : 'player';
    
    let newBoard = [...board];
    let conqueredCount = 0;

    if (activeTile.owner === 'unowned') {
        if (winnerOfDuel === turn) { // Only the challenger can capture a neutral tile
            newBoard = board.map(t =>
              t.id === activeTile.id ? { ...t, owner: winnerOfDuel } : t
            );
            conqueredCount = 1;
        }
    } else { // It's a duel
      const themeToConquer = activeTile.theme;
      newBoard = board.map(t => {
        if (t.id === activeTile.id || (t.owner === loserOfDuel && t.theme === themeToConquer)) {
          conqueredCount++;
          return { ...t, owner: winnerOfDuel };
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
    
    if (checkEndGame(newBoard)) {
      setActiveTile(null);
      setActiveQuestion(null);
      setDefendingTile(null);
      return;
    }
    
    setActiveTile(null);
    setActiveQuestion(null);
    setDefendingTile(null);
    setTurn(turn === 'player' ? 'ai' : 'player');
    setGameState('ai_thinking');
  };


  const handleModalClose = () => {
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
    setDefendingTile(null);
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

  useEffect(() => {
    if (gameState === 'ai_thinking' && turn === 'ai' && board.length > 0) {
      const aiTurn = setTimeout(async () => {
        const { rows, cols } = gridSize;
        const aiTiles = board.filter(t => t.owner === 'ai');
        let possibleTargets: TileData[] = [];

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
            let bestMove = possibleTargets.find(t => t.owner === 'player');
            if (!bestMove) {
                const unownedTargets = possibleTargets.filter(t => t.owner === 'unowned');
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

          const questionTheme = bestMove.theme;
          let toastDescription;

          if(bestMove.owner === 'player') {
            toastDescription = `A IA desafia o seu território de "${bestMove.theme}". A pergunta será sobre este tema.`;
          } else {
            toastDescription = `A IA vai tentar conquistar o território neutro de "${bestMove.theme}".`;
          }
          
          toast({
              title: `Turno da IA: Desafio!`,
              description: toastDescription,
          });
          
          const isCorrect = Math.random() > 0.35; // AI has 65% chance of being correct

          setTimeout(() => {
            const winnerOfDuel = isCorrect ? 'ai' : 'player';
            const loserOfDuel = winnerOfDuel === 'player' ? 'ai' : 'player';
            
            let resultToastTitle: string;
            let resultToastDescription: string;
            
            if (isCorrect) {
                resultToastTitle = `A IA respondeu corretamente!`;
            } else {
                resultToastTitle = `A IA respondeu incorretamente!`;
            }

            let newBoard = [...board];
            let conqueredCount = 0;

            if (bestMove.owner === 'unowned') {
                if (isCorrect) { // AI wins
                    newBoard = board.map(t =>
                        t.id === bestMove.id ? { ...t, owner: 'ai' } : t
                    );
                    conqueredCount = 1;
                    resultToastDescription = `A IA conquistou o território "${bestMove.theme}".`;
                } else { // Player "wins" by the AI failing, but nothing changes
                    resultToastDescription = `O território "${bestMove.theme}" permanece neutro.`;
                }
            } else { // It was a duel against the player
              const themeToConquer = bestMove.theme;
              newBoard = board.map(t => {
                if (t.id === bestMove.id || (t.owner === loserOfDuel && t.theme === themeToConquer)) {
                  conqueredCount++;
                  return { ...t, owner: winnerOfDuel };
                }
                return t;
              });

              if (winnerOfDuel === 'ai') {
                  resultToastDescription = `A IA conquistou o seu território de "${themeToConquer}" e ${conqueredCount - 1} outras casas do mesmo tema.`;
              } else {
                  resultToastDescription = `Você defendeu-se com sucesso! A IA perdeu o seu território de "${themeToConquer}".`;
              }
            }
            
            toast({
                title: resultToastTitle,
                description: resultToastDescription,
            });
            
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
        isOpen={gameState === 'question' || (gameState === 'ai_thinking' && activeTile !== null)}
        tile={activeTile}
        question={activeQuestion}
        onAnswer={handleAnswer}
        onClose={handleModalClose}
        defendingTile={defendingTile}
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

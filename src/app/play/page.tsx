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
  const [duel, setDuel] = useState<DuelState | null>(null);

  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

    const isDuel = tile.owner !== 'unowned';
    const questionTheme = tile.theme;

    setActiveTile(tile);
    
    if (isDuel) {
        toast({
            title: `Duelo iniciado!`,
            description: `Você desafia a IA. A pergunta será sobre o tema do território dela: "${questionTheme}".`,
        });
        setGameState('duel');
        // Pre-load a couple of questions for the duel
        const questions = await Promise.all([
            generateQuestion(questionTheme, language),
            generateQuestion(questionTheme, language)
        ]);

        const duelQuestions = questions.filter((q): q is Question => !('error' in q)).map(q => ({
            ...q,
            imageUrl: `https://source.unsplash.com/400x300/?${encodeURIComponent(q.imageQuery)}`
        }));
        
        setDuel({
            challenger: 'player',
            defender: 'ai',
            timeRemaining: 45,
            questions: duelQuestions,
            activeQuestionIndex: 0,
            turn: 'challenger'
        });
        setActiveQuestion(duelQuestions[0] || null);

    } else { // Unowned tile
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
            return;
        }
        
        const imageUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(questionResult.imageQuery)}`;
        
        setActiveQuestion({...questionResult, imageUrl});
        setGameState('question');
    }
  };
  
  const handleAnswer = (correct: boolean) => {
    if (!activeTile) return;

    const winnerOfTurn = correct ? turn : (turn === 'player' ? 'ai' : 'player');
    
    let newBoard = [...board];
    
    if (activeTile.owner === 'unowned') {
        if (winnerOfTurn === turn) { // Only the challenger can capture a neutral tile
            newBoard = board.map(t =>
              t.id === activeTile.id ? { ...t, owner: winnerOfTurn } : t
            );
        }
    } else { // It's a duel
      const loserOfDuel = winnerOfTurn === 'player' ? 'ai' : 'player';
      const themeToConquer = activeTile.theme;
      newBoard = board.map(t => {
        if (t.id === activeTile.id || (t.owner === loserOfDuel && t.theme === themeToConquer)) {
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
    
    if (checkEndGame(newBoard)) {
      setActiveTile(null);
      setActiveQuestion(null);
      return;
    }
    
    setActiveTile(null);
    setActiveQuestion(null);
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
  
  // Duel Timer Logic
  useEffect(() => {
    if (gameState === 'duel' && duel && duel.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setDuel(prevDuel => {
          if (prevDuel && prevDuel.timeRemaining > 1) {
            return { ...prevDuel, timeRemaining: prevDuel.timeRemaining - 1 };
          }
          if (timerRef.current) clearInterval(timerRef.current);
          return null; // End of duel
        });
      }, 1000);
    } else if (gameState !== 'duel' && timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, duel]);


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
            const winnerOfTurn = isCorrect ? 'ai' : 'player';
            
            let resultToastTitle: string;
            let resultToastDescription: string;
            
            if (isCorrect) {
                resultToastTitle = `A IA respondeu corretamente!`;
            } else {
                resultToastTitle = `A IA respondeu incorretamente!`;
            }

            let newBoard = [...board];

            if (bestMove!.owner === 'unowned') {
                if (isCorrect) { // AI wins
                    newBoard = board.map(t =>
                        t.id === bestMove!.id ? { ...t, owner: 'ai' } : t
                    );
                    resultToastDescription = `A IA conquistou o território "${bestMove!.theme}".`;
                } else { // Player "wins" by the AI failing, but nothing changes
                    resultToastDescription = `O território "${bestMove!.theme}" permanece neutro.`;
                }
            } else { // It was a duel against the player
              const loserOfDuel = winnerOfTurn === 'player' ? 'ai' : 'player';
              const themeToConquer = bestMove!.theme;
              newBoard = board.map(t => {
                if (t.id === bestMove!.id || (t.owner === loserOfDuel && t.theme === themeToConquer)) {
                  return { ...t, owner: winnerOfTurn };
                }
                return t;
              });

              const conqueredCount = newBoard.filter(t => t.owner === winnerOfTurn).length - scores[winnerOfTurn];

              if (winnerOfTurn === 'ai') {
                  resultToastDescription = `A IA conquistou o seu território de "${themeToConquer}" e ${conqueredCount > 0 ? `${conqueredCount}` : 'outras'} casas do mesmo tema.`;
              } else {
                  resultToastDescription = `Você defendeu-se com sucesso! A IA perdeu as suas casas com o tema "${themeToConquer}".`;
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
  }, [gameState, turn, board, gridSize, checkEndGame, toast, language, getNeighbors, scores]);

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

    
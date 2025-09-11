'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateFloor as generateFloorAction, generateQuestion as generateQuestionAction } from '@/lib/actions';
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
import { Progress } from '@/components/ui/progress';

type GameState = 'setup' | 'loading_board' | 'playing' | 'fetching_question' | 'ai_turn' | 'question' | 'duel' | 'finished';

type TileData = {
  id: number;
  theme: string;
  owner: Player | 'unowned';
};

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


const loadingMessages = [
  "A afiar os neurónios...",
  "A consultar os sábios da antiguidade...",
  "A calibrar o motor de trivia...",
  "Quase lá, não adormeça!",
  "A polir as perguntas para brilharem...",
  "A desvendar os segredos do universo...",
  "A preparar uma dose de conhecimento...",
];


export default function PlayPage() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [board, setBoard] = useState<TileData[]>([]);
  const [language, setLanguage] = useState('English');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [turn, setTurn] = useState<Player>('player');
  const [activeTile, setActiveTile] = useState<TileData | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [duel, setDuel] = useState<DuelState | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);


  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playAudio = useAudio();

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
      
       // Check if the conquered tile belonged to the opponent, triggering a full theme conquest
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
          // Normal win condition: conquer a single unowned tile
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
    
    setActiveTile(null);
    setActiveQuestion(null);
    setDuel(null);
    if(timerRef.current) clearInterval(timerRef.current);

    if (checkEndGame(newBoard)) {
      return;
    }
    
    // "Winner continues" logic
    if (tileWasConquered) {
      // If a tile was taken, the current player continues
      setGameState(currentTurnPlayer === 'ai' ? 'ai_turn' : 'playing');
    } else {
      // If no tile was taken (wrong answer), switch turns
      const nextTurn = currentTurnPlayer === 'player' ? 'ai' : 'player';
      setTurn(nextTurn);
      setGameState(nextTurn === 'ai' ? 'ai_turn' : 'playing');
    }
  }, [board, checkEndGame, playAudio]);


  const endDuel = useCallback((finalDuelState: DuelState, duelTile: TileData) => {
    let wasTurnSuccessful: boolean;
    if (finalDuelState.challenger === 'player') {
      // Challenger must have more correct answers to win
      wasTurnSuccessful = finalDuelState.playerCorrect > finalDuelState.aiCorrect;
    } else { // AI is challenger
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
  }, [endTurn, toast]);

  const handleGameStart = useCallback(async (diff: GameDifficulty, lang: string, startPlayer: Player) => {
    setGameState('loading_board');
    setLanguage(lang);
    setDifficulty(diff);
    setTurn(startPlayer);
    
    localStorage.setItem('tile-takeover-difficulty', diff);
    localStorage.setItem('tile-takeover-language', lang);

    const result = await generateFloorAction(diff, lang);
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

    initialBoard[0].owner = 'player';
    initialBoard[initialBoard.length - 1].owner = 'ai';

    setGridSize({ rows, cols });
    setBoard(initialBoard);
    setScores({ player: 1, ai: 1 });
    setGameState(startPlayer === 'ai' ? 'ai_turn' : 'playing');
  }, [toast]);
  

  const handleTileClick = async (tile: TileData) => {
    if (gameState !== 'playing' || turn !== 'player') return;

    setActiveTile(tile);
    setGameState('fetching_question');

    const isDuel = tile.owner === 'ai';
    const questionTheme = tile.theme;

    let questionCount = 1;
    if (isDuel) {
      playAudio('/sounds/duel.mp3');
      const territoryCount = board.filter(t => t.owner === 'ai' && t.theme === questionTheme).length;
      questionCount = Math.max(MIN_DUEL_QUESTIONS, territoryCount);
    }

    const questionResult = await generateQuestionAction(questionTheme, language, questionCount);

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
    
    if (isDuel) {
        const totalDuelTime = DUEL_TIME_PER_QUESTION * questionResult.length;
        toast({
            title: `Duelo Iniciado!`,
            description: `Tema: "${questionTheme}". Você tem ${totalDuelTime} segundos para responder a ${questionResult.length} pergunta(s).`,
        });
        
        setActiveQuestion(questionResult[0]);
        setDuel({
            challenger: 'player',
            questions: questionResult,
            activeQuestionIndex: 0,
            playerCorrect: 0,
            aiCorrect: 0,
            timeRemaining: totalDuelTime,
        });
        
        setGameState('duel');
    } else { 
        setActiveQuestion(questionResult[0]);
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
      // Delay to show the correct/incorrect answer flash
      setTimeout(() => endTurn(correct, 'player', tileToConquer), 1500);
      return;
    }

    if (gameState === 'duel' && duel) {
      const newPlayerCorrect = duel.playerCorrect + (correct ? 1 : 0);
      // In a player duel, the AI's response is simulated.
      const aiResponseCorrect = Math.random() > 0.35; // AI has a 65% chance of being correct
      const newAiCorrect = duel.aiCorrect + (aiResponseCorrect ? 1 : 0);

      const nextQuestionIndex = duel.activeQuestionIndex + 1;
      
      const updatedDuelState: DuelState = {
          ...duel,
          playerCorrect: newPlayerCorrect,
          aiCorrect: newAiCorrect,
      };

      if (nextQuestionIndex < duel.questions.length) {
        // More questions in the duel, move to the next one
        setTimeout(() => {
            setDuel({
              ...updatedDuelState,
              activeQuestionIndex: nextQuestionIndex,
            });
            setActiveQuestion(duel.questions[nextQuestionIndex]);
        }, 1500); // Delay to show flash
      } else {
        // Last question answered, end the duel
        if (timerRef.current) clearInterval(timerRef.current);
        const tileToConquer = activeTile;
        // Need to set duel state here before calling endDuel
        setDuel(updatedDuelState); 
        endDuel(updatedDuelState, tileToConquer);
      }
    }
  };
  
  const handleModalClose = () => {
    if (!activeTile) return;
    if (gameState === 'question') {
      endTurn(false, 'player', activeTile);
    }
    if (gameState === 'duel' && duel) {
      // If player closes modal during their duel, they lose the challenge
       if (timerRef.current) clearInterval(timerRef.current);
      endDuel(duel, activeTile);
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
  
  // Effect for duel timer countdown
  useEffect(() => {
    if (gameState === 'duel' && duel && duel.timeRemaining > 0) {
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
  }, [gameState, duel]);

  // Effect to end duel when time runs out
  useEffect(() => {
    if (gameState === 'duel' && duel && duel.timeRemaining === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      toast({
        title: "O tempo acabou!",
        description: "O desafiante perdeu o duelo.",
        variant: "destructive",
      });
      if(activeTile){
        endDuel(duel, activeTile);
      }
    }
  }, [gameState, duel, activeTile, endDuel, toast]);
  
  // Effect for loading animation
  useEffect(() => {
    let progressInterval: NodeJS.Timeout | null = null;
    let messageInterval: NodeJS.Timeout | null = null;

    if (gameState === 'fetching_question') {
      setLoadingProgress(0);
      setLoadingMessage(loadingMessages[0]);
      
      const estimatedTime = (activeTile?.owner === 'ai' ? 8000 : 4000); // 8s for duel, 4s for single

      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) {
            return prev;
          }
          return prev + 2;
        });
      }, estimatedTime / 50);
      
      messageInterval = setInterval(() => {
        setLoadingMessage(prevMessage => {
          const currentIndex = loadingMessages.indexOf(prevMessage);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 2500);

    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (messageInterval) clearInterval(messageInterval);
    };
  }, [gameState, activeTile]);


  useEffect(() => {
    if (gameState !== 'ai_turn' || turn !== 'ai' || board.length === 0) {
      return;
    }

    const aiTurnTimeout = setTimeout(async () => {
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
        // Prioritize duels that give more tiles
        if (duelTargets.length > 0) {
            duelTargets.sort((a, b) => b.territorySize - a.territorySize);
            targetTile = duelTargets[0].tile;
        } else if (unownedTargets.length > 0) {
            targetTile = unownedTargets[Math.floor(Math.random() * unownedTargets.length)];
        }
        
        if (!targetTile) {
           toast({ title: 'A IA não tem jogadas!', description: 'É a sua vez.' });
           setTurn('player');
           setGameState('playing');
           return;
        }

        const isDuel = targetTile.owner === 'player';
        const theme = targetTile.theme;
        
        if (isDuel) {
            playAudio('/sounds/duel.mp3');
            const territoryCount = board.filter(t => t.owner === 'player' && t.theme === theme).length;
            const numQuestions = Math.max(MIN_DUEL_QUESTIONS, territoryCount);

            toast({
                title: `Turno da IA: Desafio!`,
                description: `A IA desafia o seu território de "${theme}". Prepare-se para um duelo de ${numQuestions} perguntas!`,
            });
            
            // Simulate duel after a short delay
            setTimeout(() => {
                let aiCorrect = 0;
                let playerCorrect = 0;
                // Simulate answers for the duel
                for(let i = 0; i < numQuestions; i++){
                    if (Math.random() > 0.35) aiCorrect++; // AI is 65% likely to be correct
                    if (Math.random() > 0.5) playerCorrect++; // Player is 50% likely to be correct
                }

                const aiWon = aiCorrect > playerCorrect;
                
                if (aiWon) {
                    playAudio('/sounds/lose.mp3');
                }
                
                toast({
                    title: `Duelo com IA terminado!`,
                    description: `A IA acertou ${aiCorrect} e você ${playerCorrect}. A IA ${aiWon ? 'venceu' : 'perdeu'}!`,
                    variant: aiWon ? 'destructive' : 'default'
                });
                // Use a different timeout to announce result before ending turn
                setTimeout(() => {
                  endTurn(aiWon, 'ai', targetTile!);
                }, 1500)
            }, 2000);

        } else {
            toast({
                title: `Turno da IA`,
                description: `A IA tenta conquistar o território neutro de "${theme}".`,
            });
            
            const isCorrect = Math.random() > 0.35; // 65% chance to be correct

            // Simulate AI thinking time
            setTimeout(() => {
                if (isCorrect) {
                  playAudio('/sounds/correct.mp3');
                } else {
                  playAudio('/sounds/incorrect.mp3');
                }
                toast({
                    title: `A IA respondeu ${isCorrect ? 'corretamente' : 'incorretamente'}!`,
                    variant: isCorrect ? 'default' : 'destructive'
                });

                // Use another timeout to show result before ending turn
                setTimeout(() => {
                    endTurn(isCorrect, 'ai', targetTile!);
                }, 1500);

            }, 2000);
        }

    }, 1500);

    return () => clearTimeout(aiTurnTimeout);
  }, [gameState, turn, board, gridSize, getNeighbors, endTurn, toast, playAudio]);

  if (gameState === 'setup') {
    return <GameSetup onStart={handleGameStart} lastDifficulty={difficulty} lastLanguage={language} />;
  }
  
  if (gameState === 'loading_board') {
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
            currentPlayer={'player'}
          />
          {gameState === 'fetching_question' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg pointer-events-none p-8 text-center">
                 <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                 <h2 className="text-2xl font-bold text-white mb-2">A preparar o seu desafio...</h2>
                 <p className="text-lg text-muted-foreground mb-6">{loadingMessage}</p>
                 <Progress value={loadingProgress} className="w-full max-w-sm" />
            </div>
          )}
           {gameState === 'ai_turn' && (
            <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center z-10 rounded-lg pointer-events-none">
                 <Loader2 className="h-10 w-10 animate-spin text-destructive" />
                 <p className="mt-2 font-semibold text-destructive-foreground bg-destructive/80 px-4 py-2 rounded-md">A IA está a pensar...</p>
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
        currentPlayer={'player'}
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

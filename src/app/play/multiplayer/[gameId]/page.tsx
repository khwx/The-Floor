'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GameState, PlayerRole, TileData, Question, MultiplayerDuelState } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Scoreboard } from '@/components/scoreboard';
import { GameBoard } from '@/components/game-board';
import { useToast } from '@/hooks/use-toast';
import { handleTileClick, submitAnswer, checkEndGame, endDuelForPlayer } from '@/lib/actions';
import { QuestionModal } from '@/components/question-modal';
import { GameOverDialog } from '@/components/game-over-dialog';

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


export default function MultiplayerGamePage({ params }: { params: { gameId: string } }) {
  const { gameId } = params;
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPlayerRole, setCurrentPlayerRole] = useState<PlayerRole | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let role = sessionStorage.getItem(`tile-takeover-player-role-${gameId}`) as PlayerRole;
    if (!role) {
      // Fallback for direct navigation/refresh - not secure, for demo only
      role = 'player2'; 
      sessionStorage.setItem(`tile-takeover-player-role-${gameId}`, role);
    }
    setCurrentPlayerRole(role);
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;

    const gameDocRef = doc(db, 'games', gameId);
    const unsubscribe = onSnapshot(gameDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as GameState;
        setGameState(data);
        setError(null);
      } else {
        setError('Jogo não encontrado. Verifique o código e tente novamente.');
        setGameState(null);
      }
    }, (err) => {
      console.error("Error fetching game state:", err);
      setError('Não foi possível carregar o jogo. Por favor, tente novamente.');
    });

    return () => unsubscribe();
  }, [gameId]);
  
  const onTileClick = useCallback(async (tile: TileData) => {
    if (!gameId || !currentPlayerRole) return;
    
    toast({ title: 'A processar a sua jogada...' });

    const result = await handleTileClick(gameId, tile.id, currentPlayerRole);
    if(result?.error) {
       toast({ title: 'Erro na Jogada', description: result.error, variant: 'destructive'});
    }

  }, [gameId, currentPlayerRole, toast]);

  const onAnswer = useCallback(async (isCorrect: boolean) => {
    if (!gameId || !gameState || !currentPlayerRole || (!gameState.activeQuestion && !gameState.duelState)) return;
    
    const activeTileId = gameState.activeQuestion?.tile.id ?? gameState.duelState?.tile.id;
    if(activeTileId === undefined) return;

    const result = await submitAnswer(gameId, currentPlayerRole, activeTileId, isCorrect);
    
    if(result?.error) {
        toast({ title: 'Erro ao Submeter', description: result.error, variant: 'destructive'});
    }
  }, [gameId, gameState, currentPlayerRole, toast]);

  const onModalClose = useCallback(async () => {
    if (!gameId || !gameState || !currentPlayerRole) return;

    // A player closing a modal counts as a wrong answer.
    if (gameState.activeQuestion) {
        await onAnswer(false);
    } else if (gameState.duelState) {
        // In a duel, closing the modal forfeits the duel for that player
        await endDuelForPlayer(gameId, currentPlayerRole);
    }
  }, [gameId, gameState, currentPlayerRole, onAnswer]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-destructive p-4 text-center">
        <h1 className="text-2xl">Erro</h1>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!gameState || (!gameState.board && gameState.status !== 'error')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">
          {gameState?.status === 'generating' ? 'A gerar o seu campo de batalha...' : 'A carregar o jogo...'}
        </p>
      </div>
    );
  }
  
  if (gameState.status === 'error') {
     return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-destructive p-4 text-center">
        <h1 className="text-2xl">Erro a gerar o jogo</h1>
        <p>{gameState.errorMessage || 'Ocorreu um erro desconhecido.'}</p>
      </div>
    );
  }

  const { rows, cols } = getGridSize(gameState.board.length);
  const isMyTurn = gameState.turn === currentPlayerRole && gameState.status === 'playing';
  
  const isQuestionModalOpen = (gameState.status === 'question' || gameState.status === 'duel');
  const activeQuestion: Question | null = gameState.activeQuestion?.question ?? (gameState.duelState ? gameState.duelState.questions[gameState.duelState.activeQuestionIndex] : null);
  const activeTile: TileData | null = gameState.activeQuestion?.tile ?? gameState.duelState?.tile ?? null;

  return (
    <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
           <div>
             <h1 className="text-2xl font-bold text-primary">Sala de Jogo: {gameId}</h1>
             <p className="text-muted-foreground">Partilhe o código para o seu amigo se juntar!</p>
           </div>
          <Scoreboard scores={gameState.scores} turn={gameState.turn} />
        </header>

        <main className="relative">
           <GameBoard
            board={gameState.board}
            gridSize={{ rows, cols }}
            onTileClick={onTileClick}
            playerTurn={isMyTurn}
            currentPlayer={currentPlayerRole || 'player1'}
          />
          {gameState.status === 'waiting' && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 rounded-lg text-white p-4 text-center">
                 <Loader2 className="h-10 w-10 animate-spin mb-4" />
                 <h2 className="text-3xl font-bold">A aguardar o segundo jogador...</h2>
                 <p className="mt-2">Partilhe o código <strong className="text-accent">{gameId}</strong> com um amigo.</p>
            </div>
          )}
           {gameState.status === 'processing' && (
            <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center z-10 rounded-lg pointer-events-none">
                 <Loader2 className="h-10 w-10 animate-spin text-primary" />
                 <p className="mt-2 font-semibold text-primary-foreground bg-primary/80 px-4 py-2 rounded-md">A processar...</p>
            </div>
          )}
        </main>
      </div>

       <QuestionModal
        isOpen={isQuestionModalOpen}
        tile={activeTile}
        question={activeQuestion}
        onAnswer={onAnswer}
        onClose={onModalClose}
        duel={gameState.duelState}
        currentPlayer={currentPlayerRole}
      />
       <GameOverDialog
        isOpen={gameState.status === 'finished'}
        winner={gameState.winner ?? null}
        scores={gameState.scores}
        onPlayAgain={() => window.location.href = '/play/multiplayer'}
      />
    </div>
  );
}

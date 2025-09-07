'use client';

// This is a placeholder for the real-time multiplayer game page.
// The actual implementation will be done in the next step.

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GameState } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Scoreboard } from '@/components/scoreboard';
import { GameBoard } from '@/components/game-board';

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

  useEffect(() => {
    if (!gameId) return;

    const gameDocRef = doc(db, 'games', gameId);
    const unsubscribe = onSnapshot(gameDocRef, (doc) => {
      if (doc.exists()) {
        setGameState(doc.data() as GameState);
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

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-destructive">
        <h1 className="text-2xl">Erro</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">A carregar o jogo...</p>
      </div>
    );
  }

  const { rows, cols } = getGridSize(gameState.board.length);

  return (
    <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl">
        <header className="flex justify-between items-center mb-4">
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
            onTileClick={() => { /* Real-time logic will go here */}}
            playerTurn={false} // This will depend on the current player vs game turn
            currentPlayer={gameState.turn}
          />
          {gameState.status === 'waiting' && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 rounded-lg text-white p-4">
                 <Loader2 className="h-10 w-10 animate-spin mb-4" />
                 <h2 className="text-3xl font-bold">A aguardar o segundo jogador...</h2>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

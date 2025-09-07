'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GameState, PlayerRole } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Scoreboard } from '@/components/scoreboard';
import { GameBoard } from '@/components/game-board';
import { useToast } from '@/hooks/use-toast';

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
    // This is a simplified way to assign a player role.
    // In a real app, you'd use Firebase Auth to get a persistent user ID.
    let role = sessionStorage.getItem(`tile-takeover-player-role-${gameId}`) as PlayerRole;
    if (!role) {
      // If no role is assigned for this game, assume they are player2 joining.
      // This is not secure and for demonstration only.
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
        
        // Handle the case where the board is being generated
        if(data.status === 'generating') {
           setGameState(data);
           return;
        }

        if (!data.board || data.board.length === 0) {
            setError('O tabuleiro ainda não foi gerado. A aguardar o segundo jogador...');
            setGameState(null);
            return;
        }

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

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-destructive p-4 text-center">
        <h1 className="text-2xl">Erro</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!gameState || gameState.status === 'generating') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">A gerar o seu campo de batalha...</p>
      </div>
    );
  }

  const { rows, cols } = getGridSize(gameState.board.length);
  const isMyTurn = gameState.turn === currentPlayerRole && gameState.status === 'playing';

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
            onTileClick={(tile) => console.log('Tile clicked:', tile.id)}
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
        </main>
      </div>
    </div>
  );
}

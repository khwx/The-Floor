import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Player } from '@/lib/types';
import { User, Bot, UserSquare, UserCircle } from 'lucide-react';

type ScoreboardProps = {
  scores: { player: number; ai: number } | { player1: number; player2: number };
  turn: Player;
};

export function Scoreboard({ scores, turn }: ScoreboardProps) {
  const isMultiplayer = 'player1' in scores;

  if (isMultiplayer) {
    const mpScores = scores as { player1: number; player2: number };
    return (
      <Card className="flex gap-4 p-2 shadow-md">
        <div className={cn(
            "flex items-center gap-2 p-2 rounded-md transition-all",
            turn === 'player1' && 'bg-primary/20'
        )}>
          <UserSquare className="h-6 w-6 text-primary" />
          <span className="text-2xl font-bold">{mpScores.player1}</span>
        </div>
         <div className={cn(
            "flex items-center gap-2 p-2 rounded-md transition-all",
            turn === 'player2' && 'bg-accent/20'
        )}>
          <UserCircle className="h-6 w-6 text-accent" />
          <span className="text-2xl font-bold">{mpScores.player2}</span>
        </div>
      </Card>
    );
  }

  const spScores = scores as { player: number; ai: number };
  return (
    <Card className="flex gap-4 p-2 shadow-md">
      <div className={cn(
          "flex items-center gap-2 p-2 rounded-md transition-all",
          turn === 'player' && 'bg-primary/20'
      )}>
        <User className="h-6 w-6 text-primary" />
        <span className="text-2xl font-bold">{spScores.player}</span>
      </div>
       <div className={cn(
          "flex items-center gap-2 p-2 rounded-md transition-all",
          turn === 'ai' && 'bg-destructive/20'
      )}>
        <Bot className="h-6 w-6 text-destructive" />
        <span className="text-2xl font-bold">{spScores.ai}</span>
      </div>
    </Card>
  );
}

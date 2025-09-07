import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Player } from '@/lib/types';
import { User, Bot } from 'lucide-react';

type ScoreboardProps = {
  scores: { player: number; ai: number };
  turn: Player;
};

export function Scoreboard({ scores, turn }: ScoreboardProps) {
  return (
    <Card className="flex gap-4 p-2 shadow-md">
      <div className={cn(
          "flex items-center gap-2 p-2 rounded-md transition-all",
          turn === 'player' && 'bg-primary/20'
      )}>
        <User className="h-6 w-6 text-primary" />
        <span className="text-2xl font-bold">{scores.player}</span>
      </div>
       <div className={cn(
          "flex items-center gap-2 p-2 rounded-md transition-all",
          turn === 'ai' && 'bg-destructive/20'
      )}>
        <Bot className="h-6 w-6 text-destructive" />
        <span className="text-2xl font-bold">{scores.ai}</span>
      </div>
    </Card>
  );
}

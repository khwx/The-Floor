import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Player } from '@/lib/types';
import { Trophy, User, Bot, Scale } from 'lucide-react';

type GameOverDialogProps = {
  isOpen: boolean;
  winner: Player | 'draw' | null;
  scores: { player: number; ai: number };
  onPlayAgain: () => void;
};

export function GameOverDialog({ isOpen, winner, scores, onPlayAgain }: GameOverDialogProps) {
  if (!winner) return null;

  const messages = {
    player: { title: "You Win!", icon: <Trophy className="h-16 w-16 text-yellow-400" />, description: "Congratulations! You have conquered the floor." },
    ai: { title: "You Lose", icon: <Bot className="h-16 w-16 text-destructive" />, description: "The AI has bested you. Better luck next time!" },
    draw: { title: "It's a Draw!", icon: <Scale className="h-16 w-16 text-muted-foreground" />, description: "A hard-fought battle ends in a stalemate." },
  };

  const { title, icon, description } = messages[winner];

  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
          <div className="mb-4">{icon}</div>
          <DialogTitle className="text-4xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-lg">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="my-6 flex justify-around text-center">
            <div className="flex flex-col items-center gap-2">
                <User className="h-8 w-8 text-primary"/>
                <p className="text-sm text-muted-foreground">Your Score</p>
                <p className="text-3xl font-bold">{scores.player}</p>
            </div>
            <div className="flex flex-col items-center gap-2">
                <Bot className="h-8 w-8 text-destructive"/>
                <p className="text-sm text-muted-foreground">AI Score</p>
                <p className="text-3xl font-bold">{scores.ai}</p>
            </div>
        </div>
        <DialogFooter>
          <Button onClick={onPlayAgain} className="w-full" size="lg">Play Again</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

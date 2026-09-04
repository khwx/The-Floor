import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Player, PlayerRole } from '@/lib/types';
import { Trophy, User, Bot, Scale, UserSquare, UserCircle } from 'lucide-react';

type GameOverDialogProps = {
  isOpen: boolean;
  winner: Player | PlayerRole | 'draw' | null;
  scores: { player: number; ai: number } | { player1: number; player2: number; };
  onPlayAgain: () => void;
};

export function GameOverDialog({ isOpen, winner, scores, onPlayAgain }: GameOverDialogProps) {
  if (!winner) return null;

  const isMultiplayer = 'player1' in scores;

  const messages = {
    player: { title: "Você Ganhou!", icon: <Trophy className="h-16 w-16 text-yellow-400" />, description: "Parabéns! Conquistou o tabuleiro." },
    ai: { title: "Você Perdeu", icon: <Bot className="h-16 w-16 text-destructive" />, description: "A IA venceu. Mais sorte para a próxima!" },
    player1: { title: "Jogador 1 Venceu!", icon: <Trophy className="h-16 w-16 text-primary" />, description: "Parabéns, Jogador 1! Conquistou o tabuleiro." },
    player2: { title: "Jogador 2 Venceu!", icon: <Trophy className="h-16 w-16 text-accent" />, description: "Parabéns, Jogador 2! Conquistou o tabuleiro." },
    draw: { title: "É um Empate!", icon: <Scale className="h-16 w-16 text-muted-foreground" />, description: "Uma batalha renhida termina em empate." },
  };

  const winnerKey = winner as keyof typeof messages;
  const { title, icon, description } = messages[winnerKey] || messages.draw;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onPlayAgain()}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="items-center text-center">
          <div className="mb-4">{icon}</div>
          <DialogTitle className="text-4xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-lg">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="my-6 flex justify-around text-center">
            {isMultiplayer ? (
              <>
                <div className="flex flex-col items-center gap-2">
                    <UserSquare className="h-8 w-8 text-primary"/>
                    <p className="text-sm text-muted-foreground">Jogador 1</p>
                    <p className="text-3xl font-bold">{(scores as { player1: number }).player1}</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <UserCircle className="h-8 w-8 text-accent"/>
                    <p className="text-sm text-muted-foreground">Jogador 2</p>
                    <p className="text-3xl font-bold">{(scores as { player2: number }).player2}</p>
                </div>
              </>
            ) : (
               <>
                <div className="flex flex-col items-center gap-2">
                    <User className="h-8 w-8 text-primary"/>
                    <p className="text-sm text-muted-foreground">A sua Pontuação</p>
                    <p className="text-3xl font-bold">{(scores as { player: number }).player}</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Bot className="h-8 w-8 text-destructive"/>
                    <p className="text-sm text-muted-foreground">Pontuação da IA</p>
                    <p className="text-3xl font-bold">{(scores as { ai: number }).ai}</p>
                </div>
               </>
            )}
        </div>
        <DialogFooter>
          <Button onClick={onPlayAgain} className="w-full" size="lg">Jogar Novamente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

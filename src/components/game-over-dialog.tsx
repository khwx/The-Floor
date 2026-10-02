import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Player, PlayerRole, TeamId, GameMode } from '@/lib/types';
import { Trophy, User, Bot, Scale, UserSquare, UserCircle, Users } from 'lucide-react';

type GameOverDialogProps = {
  isOpen: boolean;
  winner: Player | PlayerRole | TeamId | 'draw' | null;
  scores: { player: number; ai: number } | { player1: number; player2: number; player3?: number; player4?: number; };
  gameMode?: GameMode;
  onPlayAgain: () => void;
};

export function GameOverDialog({ isOpen, winner, scores, gameMode, onPlayAgain }: GameOverDialogProps) {
  if (!winner) return null;

  const isTeamMode = gameMode === 'team';
  const isMultiplayer = 'player1' in scores;

  const messages = {
    player: { title: "Você Ganhou!", icon: <Trophy className="h-16 w-16 text-yellow-400" />, description: "Parabéns! Conquistou o tabuleiro." },
    ai: { title: "Você Perdeu", icon: <Bot className="h-16 w-16 text-destructive" />, description: "A IA venceu. Mais sorte para a próxima!" },
    player1: { title: "Jogador 1 Venceu!", icon: <Trophy className="h-16 w-16 text-primary" />, description: "Parabéns, Jogador 1! Conquistou o tabuleiro." },
    player2: { title: "Jogador 2 Venceu!", icon: <Trophy className="h-16 w-16 text-accent" />, description: "Parabéns, Jogador 2! Conquistou o tabuleiro." },
    player3: { title: "Jogador 3 Venceu!", icon: <Trophy className="h-16 w-16 text-blue-500" />, description: "Parabéns, Jogador 3! Conquistou o tabuleiro." },
    player4: { title: "Jogador 4 Venceu!", icon: <Trophy className="h-16 w-16 text-purple-500" />, description: "Parabéns, Jogador 4! Conquistou o tabuleiro." },
    team1: { title: "Equipa 1 Venceu!", icon: <Users className="h-16 w-16 text-primary" />, description: "Parabéns, Equipa 1! Conquistaram o tabuleiro." },
    team2: { title: "Equipa 2 Venceu!", icon: <Users className="h-16 w-16 text-accent" />, description: "Parabéns, Equipa 2! Conquistaram o tabuleiro." },
    draw: { title: "É um Empate!", icon: <Scale className="h-16 w-16 text-muted-foreground" />, description: "Uma batalha renhida termina em empate." },
  };

  const winnerKey = winner as keyof typeof messages;
  const { title, icon, description } = messages[winnerKey] || messages.draw;

  const scoreEntries = isTeamMode ? [
    { label: 'Equipa 1', score: (scores as any).player1 + (scores as any).player3, icon: <Users className="h-8 w-8 text-primary"/> },
    { label: 'Equipa 2', score: (scores as any).player2 + (scores as any).player4, icon: <Users className="h-8 w-8 text-accent"/> },
  ] : isMultiplayer ? [
    { label: 'Jogador 1', score: (scores as any).player1, icon: <UserSquare className="h-8 w-8 text-primary"/> },
    { label: 'Jogador 2', score: (scores as any).player2, icon: <UserCircle className="h-8 w-8 text-accent"/> },
    { label: 'Jogador 3', score: (scores as any).player3 || 0, icon: <UserSquare className="h-8 w-8 text-blue-500"/> },
    { label: 'Jogador 4', score: (scores as any).player4 || 0, icon: <UserCircle className="h-8 w-8 text-purple-500"/> },
  ].filter(s => s.score > 0 || isTeamMode) : [
    { label: 'A sua Pontuação', score: (scores as any).player, icon: <User className="h-8 w-8 text-primary"/> },
    { label: 'Pontuação da IA', score: (scores as any).ai, icon: <Bot className="h-8 w-8 text-destructive"/> },
  ];

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
          {scoreEntries.map((entry, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              {entry.icon}
              <p className="text-sm text-muted-foreground">{entry.label}</p>
              <p className="text-3xl font-bold">{entry.score}</p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onPlayAgain} className="w-full" size="lg">Jogar Novamente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  language: string;
  onPlayAgain: () => void;
};

// Translation messages with explicit type for string indexing
const gameOverMessages: Record<string, { Portuguese: { title: string; description: string }; English: { title: string; description: string } }> = {
  player: {
    Portuguese: { title: 'Você Ganhou!', description: 'Parabéns! Conquistou o tabuleiro.' },
    English: { title: 'You Won!', description: 'Congratulations! You conquered the board.' },
  },
  ai: {
    Portuguese: { title: 'Você Perdeu', description: 'A IA venceu. Mais sorte para a próxima!' },
    English: { title: 'You Lost', description: 'The AI won. Better luck next time!' },
  },
  player1: {
    Portuguese: { title: 'Jogador 1 Venceu!', description: 'Parabéns, Jogador 1! Conquistou o tabuleiro.' },
    English: { title: 'Player 1 Won!', description: 'Congratulations, Player 1! You conquered the board.' },
  },
  player2: {
    Portuguese: { title: 'Jogador 2 Venceu!', description: 'Parabéns, Jogador 2! Conquistou o tabuleiro.' },
    English: { title: 'Player 2 Won!', description: 'Congratulations, Player 2! You conquered the board.' },
  },
  player3: {
    Portuguese: { title: 'Jogador 3 Venceu!', description: 'Parabéns, Jogador 3! Conquistou o tabuleiro.' },
    English: { title: 'Player 3 Won!', description: 'Congratulations, Player 3! You conquered the board.' },
  },
  player4: {
    Portuguese: { title: 'Jogador 4 Venceu!', description: 'Parabéns, Jogador 4! Conquistou o tabuleiro.' },
    English: { title: 'Player 4 Won!', description: 'Congratulations, Player 4! You conquered the board.' },
  },
  team1: {
    Portuguese: { title: 'Equipa 1 Venceu!', description: 'Parabéns, Equipa 1! Conquistaram o tabuleiro.' },
    English: { title: 'Team 1 Won!', description: 'Congratulations, Team 1! You conquered the board.' },
  },
  team2: {
    Portuguese: { title: 'Equipa 2 Venceu!', description: 'Parabéns, Equipa 2! Conquistaram o tabuleiro.' },
    English: { title: 'Team 2 Won!', description: 'Congratulations, Team 2! You conquered the board.' },
  },
  draw: {
    Portuguese: { title: 'É um Empate!', description: 'Uma batalha renhida termina em empate.' },
    English: { title: 'It\'s a Draw!', description: 'A close battle ends in a draw.' },
  },
};

// Map winner keys to icon components
const iconMap: Record<string, React.ComponentType> = {
  player: Trophy,
  ai: Bot,
  player1: Trophy,
  player2: Trophy,
  player3: Trophy,
  player4: Trophy,
  team1: Users,
  team2: Users,
  draw: Scale,
};

export function GameOverDialog({ isOpen, winner, scores, gameMode, language, onPlayAgain }: GameOverDialogProps) {
  if (!winner) return null;

  const isTeamMode = gameMode === 'team';
  const isMultiplayer = 'player1' in scores;

  // Get translated messages with type-safe fallback
  const messages = gameOverMessages[winner as keyof typeof gameOverMessages];
  const langKey = language as 'Portuguese' | 'English';
  const i18n = messages?.[langKey] || messages?.English || messages?.Portuguese;
  const { title, description } = i18n || { title: '', description: '' };

  const WinnerIcon = iconMap[winner as keyof typeof iconMap] || Trophy;

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
          <div className="mb-4">
            {/* @ts-ignore - WinnerIcon accepts className at runtime */}
            <WinnerIcon className="h-16 w-16" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
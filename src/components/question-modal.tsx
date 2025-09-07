import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { TileData } from '@/lib/types';
import { getIconForTheme } from './icons';
import { Check, X } from 'lucide-react';

type QuestionModalProps = {
  isOpen: boolean;
  tile: TileData | null;
  onAnswer: (correct: boolean) => void;
};

export function QuestionModal({ isOpen, tile, onAnswer }: QuestionModalProps) {
  if (!tile) return null;

  const ThemeIcon = getIconForTheme(tile.theme);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onAnswer(false)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ThemeIcon className="h-6 w-6" />
            <span className="capitalize">{tile.theme}</span>
          </DialogTitle>
          <DialogDescription>
            This is a placeholder for a real trivia question. For now, choose if your answer was correct.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center text-lg font-semibold">
          What is the capital of France?
        </div>
        <DialogFooter className="grid grid-cols-2 gap-4">
          <Button variant="destructive" size="lg" onClick={() => onAnswer(false)}>
            <X className="mr-2 h-4 w-4" /> Incorrect
          </Button>
          <Button variant="default" size="lg" onClick={() => onAnswer(true)}>
            <Check className="mr-2 h-4 w-4" /> Correct
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

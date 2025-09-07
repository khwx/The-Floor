'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { TileData, Question, DuelState } from '@/lib/types';
import { getIconForTheme } from './icons';
import { Loader2, Swords, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type QuestionModalProps = {
  isOpen: boolean;
  tile: TileData | null;
  question: Question | null;
  onAnswer: (correct: boolean) => void;
  onClose: () => void;
  duel: DuelState | null;
};

export function QuestionModal({ isOpen, tile, question, onAnswer, onClose, duel }: QuestionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setSelectedOption(null);
    setIsAnswered(false);
    setImageError(false);
  }, [question]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedOption(null);
        setIsAnswered(false);
        setImageError(false);
      }, 300);
    }
  }, [isOpen]);

  if (!tile) return null;
  
  const questionTile = tile;
  const ThemeIcon = getIconForTheme(questionTile.theme);
  
  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };
  
  const handleSubmit = () => {
    if (!selectedOption || !question) return;
    setIsAnswered(true);
    const isCorrect = selectedOption === question.answer;
    onAnswer(isCorrect);
  };

  const getOptionClass = (option: string) => {
    if (!isAnswered) return '';
    if (option === question?.answer) return 'animate-flash-green';
    if (option === selectedOption && option !== question?.answer) return 'animate-flash-red';
    return 'opacity-50';
  }

  const isDuel = !!duel;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
           {isDuel ? (
            <div className="flex justify-between items-center">
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Swords className="h-6 w-6 text-primary" />
                <span>Duelo de Temas! ({duel.activeQuestionIndex + 1}/{duel.questions.length})</span>
              </DialogTitle>
              <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                <Clock className="h-6 w-6" />
                <span>{duel.timeRemaining}</span>
              </div>
            </div>
           ) : (
             <DialogTitle className="flex items-center gap-2 text-2xl">
                <ThemeIcon className="h-6 w-6" />
                <span className="capitalize">{tile.theme}</span>
             </DialogTitle>
           )}
          <DialogDescription>
            {isDuel
              ? `A pergunta é sobre o tema do território do seu adversário: "${tile.theme}".`
              : 'Responda à pergunta abaixo para conquistar a casa.'}
          </DialogDescription>
        </DialogHeader>
        
        {!question ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p>A gerar uma pergunta...</p>
          </div>
        ) : (
          <div>
            {question.imageUrl && !imageError && (
                <div className="relative aspect-video w-full mb-4 rounded-md overflow-hidden bg-muted">
                    <Image 
                        src={question.imageUrl}
                        alt={question.imageQuery}
                        width={400}
                        height={300}
                        className="object-cover"
                        data-ai-hint={question.imageQuery}
                        onError={() => setImageError(true)}
                    />
                </div>
            )}
            <div className="text-lg font-semibold text-center">
              {question.question}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {question.options.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedOption === option ? 'secondary' : 'outline'}
                  size="lg"
                  className={cn("h-auto py-3 justify-start text-left whitespace-normal transition-all duration-300", getOptionClass(option))}
                  onClick={() => handleOptionClick(option)}
                  disabled={isAnswered}
                >
                  <span className="font-bold mr-3">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleSubmit}
            disabled={!selectedOption || isAnswered}
          >
            {isAnswered ? 'A continuar...' : 'Submeter Resposta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

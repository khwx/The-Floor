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
import type { TileData, Question, MultiplayerDuelState, PlayerRole, DuelState } from '@/lib/types';
import { getIconForTheme } from './icons';
import { Loader2, Swords, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type QuestionModalProps = {
  isOpen: boolean;
  tile: TileData | null;
  question: Question | null;
  onAnswer: (correct: boolean) => void;
  onClose: () => void;
  duel: MultiplayerDuelState | DuelState | null;
  currentPlayer: PlayerRole | 'player' | null;
};

export function QuestionModal({ isOpen, tile, question, onAnswer, onClose, duel, currentPlayer }: QuestionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [feedbackCorrect, setFeedbackCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    setSelectedOption(null);
    setIsAnswered(false);
    setFeedbackCorrect(null);
    setImageError(false);
  }, [question]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedOption(null);
        setIsAnswered(false);
        setFeedbackCorrect(null);
        setImageError(false);
      }, 300);
    }
  }, [isOpen]);
  
  // Determine if the current player has already answered the current question in a duel
  useEffect(() => {
      // This logic is only for multiplayer duels
      if (duel && 'answers' in duel && currentPlayer && question) {
          const mpDuel = duel as MultiplayerDuelState;
          const currentAnswers = mpDuel.answers[mpDuel.activeQuestionIndex];
          if (currentAnswers && currentAnswers[currentPlayer as PlayerRole] !== undefined) {
              setIsAnswered(true);
          } else {
              setIsAnswered(false);
          }
      }
  }, [duel, currentPlayer, question]);

  if (!tile || !currentPlayer) return null;
  
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
    setFeedbackCorrect(isCorrect);
    onAnswer(isCorrect);
  };

  const getOptionClass = (option: string) => {
    if (!isAnswered) return '';

    // If it's a duel, we don't flash answers until both have answered, which happens on the next state update.
    if (duel && 'answers' in duel) return 'opacity-50';

    if (option === question?.answer) return 'animate-flash-green';
    if (option === selectedOption && option !== question?.answer) return 'animate-flash-red';
    return 'opacity-50';
  }
  
  const isDuel = !!duel;
  const isMultiplayerDuel = isDuel && 'answers' in duel;
  
  const playerDisplayName = {
      player: 'Jogador',
      player1: 'Jogador 1',
      player2: 'Jogador 2'
  } as const;

  let description = `Vez do ${playerDisplayName[currentPlayer as keyof typeof playerDisplayName] || 'Jogador'}. Responda à pergunta para conquistar a casa.`;
  
  if (isMultiplayerDuel) {
      const mpDuel = duel as MultiplayerDuelState;
      const answersForThisQuestion = mpDuel.answers[mpDuel.activeQuestionIndex] || {};
      const answeredPlayers = Object.keys(answersForThisQuestion);
      let duelTurnPlayer = 'Ambos os jogadores';
      if (answeredPlayers.length === 1) {
          const waitingForPlayer = answeredPlayers[0] === 'player1' ? 'player2' : 'player1';
          duelTurnPlayer = `A aguardar pelo ${playerDisplayName[waitingForPlayer]}`;
      }
       description = `Tema: "${tile.theme}". ${duelTurnPlayer}.`;
  } else if (isDuel) {
      const spDuel = duel as DuelState;
      description = `Duelo! Responda a ${spDuel.questions.length} perguntas. Tempo restante: ${spDuel.timeRemaining}s`;
  }


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
           {isDuel ? (
            <div className="flex justify-between items-center">
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Swords className="h-6 w-6 text-primary" />
                <span>Duelo! ({isMultiplayerDuel ? (duel as MultiplayerDuelState).activeQuestionIndex + 1 : (duel as DuelState).activeQuestionIndex + 1}/{isMultiplayerDuel ? (duel as MultiplayerDuelState).questions.length : (duel as DuelState).questions.length})</span>
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
            {description}
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
          {isAnswered && feedbackCorrect !== null && (
            <div className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
              feedbackCorrect
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {feedbackCorrect ? (
                <>
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>Correto!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 shrink-0" />
                  <span>Incorreto! Resposta: <strong>{question?.answer}</strong></span>
                </>
              )}
            </div>
          )}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleSubmit}
            disabled={!selectedOption || isAnswered}
          >
            {isAnswered ? 'Aguarde...' : 'Submeter Resposta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

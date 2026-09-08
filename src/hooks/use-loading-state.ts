'use client';

import { useEffect, useRef, useState } from 'react';

const loadingMessages = [
  "A afiar os neurónios...",
  "A consultar os sábios da antiguidade...",
  "A calibrar o motor de trivia...",
  "Quase lá, não adormeça!",
  "A polir as perguntas para brilharem...",
  "A desvendar os segredos do universo...",
  "A preparar uma dose de conhecimento...",
];

interface UseLoadingStateOptions {
  isLoading: boolean;
  activeTile?: { owner: string } | null;
}

export function useLoadingState({ isLoading, activeTile }: UseLoadingStateOptions) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const messageRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      setLoadingProgress(0);
      setLoadingMessage(loadingMessages[0]);
      const estimatedTime = (activeTile?.owner === 'ai' ? 8000 : 4000);

      progressRef.current = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) return prev;
          return prev + 2;
        });
      }, estimatedTime / 50);
      
      messageRef.current = setInterval(() => {
        setLoadingMessage(prevMessage => {
          const currentIndex = loadingMessages.indexOf(prevMessage);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 2500);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (messageRef.current) clearInterval(messageRef.current);
    };
  }, [isLoading, activeTile]);

  return { loadingProgress, loadingMessage };
}
'use client';

import { useEffect, useRef, useState } from 'react';

type Language = 'Portuguese' | 'English' | 'Spanish' | 'French' | 'German' | string;

const loadingMessages: Record<Language, string[]> = {
  Portuguese: [
    "A afiar os neurónios...",
    "A consultar os sábios da antiguidade...",
    "A calibrar o motor de trivia...",
    "Quase lá, não adormeça!",
    "A polir as perguntas para brilharem...",
    "A desvendar os segredos do universo...",
    "A preparar uma dose de conhecimento...",
  ],
  English: [
    "Sharpening neurons...",
    "Consulting ancient sages...",
    "Calibrating trivia engine...",
    "Almost there, don't fall asleep!",
    "Polishing questions to shine...",
    "Unveiling universe secrets...",
    "Preparing a dose of knowledge...",
  ],
  Spanish: [
    "Afilando las neuronas...",
    "Consultando a los sabios antiguos...",
    "Calibrando el motor de trivia...",
    "¡Casi ahí, no te duermas!",
    "Puliendo las preguntas para que brillen...",
    "Desvelando secretos del universo...",
    "Preparando una dosis de conocimiento...",
  ],
  French: [
    "Affûtage des neurones...",
    "Consultation des sages anciens...",
    "Calibrage du moteur de trivia...",
    "Presque là, ne t'endors pas !",
    "Polissage des questions pour qu'elles brillent...",
    "Dévoilement des secrets de l'univers...",
    "Préparation d'une dose de connaissance...",
  ],
  German: [
    "Neuronen schärfen...",
    "Die alten Weisen befragen...",
    "Trivia-Engine kalibrieren...",
    "Fast da, nicht einschlafen!",
    "Fragen zum Glänzen bringen...",
    "Die Geheimnisse des Universums lüften...",
    "Eine Dosis Wissen vorbereiten...",
  ],
};

interface UseLoadingStateOptions {
  isLoading: boolean;
  activeTile?: { owner: string } | null;
  language?: Language;
}

export function useLoadingState({ isLoading, activeTile, language = 'Portuguese' }: UseLoadingStateOptions) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[language]?.[0] || loadingMessages.Portuguese[0]);
  
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const messageRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      const messages = loadingMessages[language] || loadingMessages.Portuguese;
      setLoadingProgress(0);
      setLoadingMessage(messages[0]);
      const estimatedTime = (activeTile?.owner === 'ai' ? 8000 : 4000);

      progressRef.current = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 95) return prev;
          return prev + 2;
        });
      }, estimatedTime / 50);
      
      messageRef.current = setInterval(() => {
        setLoadingMessage(prevMessage => {
          const currentIndex = messages.indexOf(prevMessage);
          const nextIndex = (currentIndex + 1) % messages.length;
          return messages[nextIndex];
        });
      }, 2500);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (messageRef.current) clearInterval(messageRef.current);
    };
  }, [isLoading, activeTile, language]);

  return { loadingProgress, loadingMessage };
}
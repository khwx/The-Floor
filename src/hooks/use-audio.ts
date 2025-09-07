'use client';

import { useCallback, useRef } from 'react';

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((src: string, volume: number = 0.5) => {
    if (typeof window !== 'undefined') {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = src;
      audioRef.current.volume = volume;
      audioRef.current.play().catch(error => {
        // Autoplay was prevented.
        console.warn('Audio play was prevented by the browser:', error);
      });
    }
  }, []);

  return playAudio;
}

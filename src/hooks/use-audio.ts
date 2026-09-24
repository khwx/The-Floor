'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const savedMute = localStorage.getItem('tile-takeover-muted');
    if (savedMute) {
      setIsMuted(JSON.parse(savedMute));
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
        const newValue = !prev;
        localStorage.setItem('tile-takeover-muted', JSON.stringify(newValue));
        return newValue;
    });
  }, []);

  const playAudio = useCallback((src: string, volume: number = 0.5) => {
    if (isMuted || typeof window === 'undefined') return;
      
    if (!audioRef.current) {
        audioRef.current = new Audio();
    }
    audioRef.current.src = src;
    audioRef.current.volume = volume;
    audioRef.current.play().catch(error => {
    // Autoplay was prevented.
    console.warn('Audio play was prevented by the browser:', error);
    });
  }, [isMuted]);

  return { playAudio, isMuted, toggleMute };
}

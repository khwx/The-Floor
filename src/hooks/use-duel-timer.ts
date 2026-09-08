'use client';

import { useEffect, useRef } from 'react';

interface UseDuelTimerOptions {
  isActive: boolean;
  duel: { timeRemaining: number } | null;
  onTimeEnd: () => void;
}

export function useDuelTimer({ isActive, duel, onTimeEnd }: UseDuelTimerOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && duel && duel.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        // The actual state update happens in the parent component
        // This hook just manages the interval lifecycle
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, duel]);

  useEffect(() => {
    if (isActive && duel && duel.timeRemaining === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      onTimeEnd();
    }
  }, [isActive, duel, onTimeEnd]);
}
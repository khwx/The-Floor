'use client';

import { cn } from '@/lib/utils';
import type { TileData } from '@/lib/types';
import { getIconForTheme } from '@/components/icons';
import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

type TileProps = {
  tile: TileData;
  isClickable: boolean;
  onClick: () => void;
};

export function Tile({ tile, isClickable, onClick }: TileProps) {
  const ThemeIcon = getIconForTheme(tile.theme);
  const [isConquered, setIsConquered] = useState(false);
  const [prevOwner, setPrevOwner] = useState(tile.owner);

  useEffect(() => {
    if (tile.owner !== 'unowned' && prevOwner === 'unowned') {
      setIsConquered(true);
      const timer = setTimeout(() => setIsConquered(false), 400); // Animation duration
      return () => clearTimeout(timer);
    }
    setPrevOwner(tile.owner);
  }, [tile.owner, prevOwner]);

  const ownerClass = {
    player: 'bg-primary/90 ring-primary',
    ai: 'bg-destructive/90 ring-destructive',
    unowned: 'bg-card/50 hover:bg-card/80',
  }[tile.owner];

  const iconColorClass = {
    player: 'text-primary-foreground',
    ai: 'text-destructive-foreground',
    unowned: 'text-muted-foreground',
  }[tile.owner];
  
  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={cn(
        'relative aspect-square w-full rounded-md transition-all duration-300 flex flex-col items-center justify-center p-2 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-background animate-tile-spawn',
        ownerClass,
        isClickable ? 'cursor-pointer ring-accent/70 hover:ring-4 animate-pulse' : 'cursor-not-allowed',
        tile.owner !== 'unowned' && 'ring-2 ring-offset-1 ring-offset-background',
        isConquered && 'animate-tile-conquer'
      )}
      style={{ animationDelay: `${tile.id * 20}ms`, animationFillMode: 'forwards' }}
    >
      <ThemeIcon className={cn('h-1/3 w-1/3', iconColorClass)} />
      <span className={cn('text-xs font-medium text-center truncate w-full mt-1', iconColorClass, 'capitalize')}>
        {tile.theme}
      </span>
      {!isClickable && tile.owner === 'unowned' && (
        <div className="absolute inset-0 bg-black/40 rounded-md flex items-center justify-center">
            <Lock className="h-6 w-6 text-white/50" />
        </div>
      )}
    </button>
  );
}

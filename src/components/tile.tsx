'use client';

import { cn } from '@/lib/utils';
import type { TileData } from '@/lib/types';
import { getIconForTheme } from '@/components/icons';
import { Lock, User, Users, Crown, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

type TileProps = {
  tile: TileData;
  isClickable: boolean;
  isAdjacent?: boolean;
  onClick: () => void;
};

const ownerPatterns = {
  player: 'bg-[linear-gradient(45deg,currentColor_2px,transparent_2px)] bg-[length:6px_6px] opacity-30',
  player1: 'bg-[linear-gradient(45deg,currentColor_2px,transparent_2px)] bg-[length:6px_6px] opacity-30',
  player2: 'bg-[radial-gradient(currentColor_2px,transparent_2px)] bg-[length:8px_8px] opacity-30',
  player3: 'bg-[linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[length:4px_100%] opacity-30',
  player4: 'bg-[linear-gradient(0deg,currentColor_1px,transparent_1px)] bg-[length:100%_4px] opacity-30',
  ai: 'bg-[repeating-linear-gradient(45deg,currentColor,currentColor_2px,transparent_2px,transparent_6px)] opacity-30',
  unowned: '',
} as const;

const ownerIcons = {
  player: User,
  player1: User,
  player2: Users,
  player3: Crown,
  player4: Shield,
  ai: Crown,
  unowned: null,
} as const;

export function Tile({ tile, isClickable, isAdjacent, onClick }: TileProps) {
  const ThemeIcon = getIconForTheme(tile.theme);
  const [isConquered, setIsConquered] = useState(false);
  const [prevOwner, setPrevOwner] = useState(tile.owner);

  useEffect(() => {
    if (tile.owner !== 'unowned' && prevOwner !== tile.owner) {
      setIsConquered(true);
      const timer = setTimeout(() => setIsConquered(false), 400); // Animation duration
      return () => clearTimeout(timer);
    }
    setPrevOwner(tile.owner);
  }, [tile.owner, prevOwner]);

  const ownerClass = {
    player: 'bg-primary/90 ring-primary',
    player1: 'bg-primary/90 ring-primary',
    player2: 'bg-accent/90 ring-accent',
    player3: 'bg-blue-500/90 ring-blue-500',
    player4: 'bg-purple-500/90 ring-purple-500',
    ai: 'bg-destructive/90 ring-destructive',
    unowned: 'bg-card/50 hover:bg-card/80',
  }[tile.owner];

  const iconColorClass = {
    player: 'text-primary-foreground',
    player1: 'text-primary-foreground',
    player2: 'text-accent-foreground',
    player3: 'text-blue-500-foreground',
    player4: 'text-purple-500-foreground',
    ai: 'text-destructive-foreground',
    unowned: 'text-muted-foreground',
  }[tile.owner];
  
  const clickableRingClass = {
    player: 'ring-accent/70 hover:ring-4 animate-pulse',
    player1: 'ring-accent/70 hover:ring-4 animate-pulse',
    player2: 'ring-primary/70 hover:ring-4 animate-pulse',
    player3: 'ring-purple-500/70 hover:ring-4 animate-pulse',
    player4: 'ring-blue-500/70 hover:ring-4 animate-pulse',
    ai: '',
    unowned: '',
  }[tile.owner];

  const ownerLabel = {
    player: 'sua casa',
    player1: 'casa do jogador 1',
    player2: 'casa do jogador 2',
    player3: 'casa do jogador 3',
    player4: 'casa do jogador 4',
    ai: 'casa do adversário',
    unowned: 'casa livre',
  }[tile.owner];

  const OwnerIcon = ownerIcons[tile.owner];
  const patternClass = ownerPatterns[tile.owner];

  const ariaLabel = `${tile.theme}, ${ownerLabel}${isClickable ? ', clicável para atacar' : ', não clicável'}`;

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      role="gridcell"
      aria-label={ariaLabel}
      aria-disabled={!isClickable}
      className={cn(
        'relative aspect-square w-full rounded-md transition-all duration-300 flex flex-col items-center justify-center p-2 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-background animate-tile-spawn overflow-hidden',
        ownerClass,
        isClickable ? clickableRingClass : 'cursor-not-allowed',
        tile.owner !== 'unowned' && 'ring-2 ring-offset-1 ring-offset-background',
        isConquered && 'animate-tile-conquer',
        isAdjacent && tile.owner === 'unowned' && !isClickable && 'border-2 border-dashed border-green-500/50',
        isAdjacent && tile.owner === 'unowned' && isClickable && 'border-2 border-green-500/70 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
      )}
      style={{ animationDelay: `${tile.id * 20}ms`, animationFillMode: 'forwards' }}
    >
      {tile.owner !== 'unowned' && patternClass && (
        <div 
          className={cn('absolute inset-0 pointer-events-none', patternClass)}
          aria-hidden="true"
        />
      )}
      <ThemeIcon className={cn('h-1/3 w-1/3 relative z-10', iconColorClass)} />
      <span className={cn('text-xs font-medium text-center truncate w-full mt-1 capitalize relative z-10', iconColorClass)}>
        {tile.theme}
      </span>
      {OwnerIcon && tile.owner !== 'unowned' && (
        <OwnerIcon className={cn('absolute bottom-1 right-1 h-4 w-4 opacity-60', iconColorClass)} aria-hidden="true" />
      )}
      {!isClickable && tile.owner !== 'player' && tile.owner !== 'player1' && tile.owner !== 'player2' && tile.owner !== 'player3' && tile.owner !== 'player4' && (
        <div className="absolute inset-0 bg-black/40 rounded-md flex items-center justify-center">
            <Lock className="h-6 w-6 text-white/50" />
        </div>
      )}
    </button>
  );
}

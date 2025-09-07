'use client';

import type { TileData } from '@/lib/types';
import { Tile } from './tile';
import { useCallback } from 'react';

type GameBoardProps = {
  board: TileData[];
  gridSize: { rows: number; cols: number };
  onTileClick: (tile: TileData) => void;
  playerTurn: boolean;
};

export function GameBoard({ board, gridSize, onTileClick, playerTurn }: GameBoardProps) {
  
  const getIsAdjacentToPlayer = useCallback((tileId: number): boolean => {
    const playerTiles = board.filter(t => t.owner === 'player').map(t => t.id);
    const { rows, cols } = gridSize;
    
    // Check all player tiles to see if any are neighbors to the target tileId
    for (const playerTileId of playerTiles) {
        const r = Math.floor(playerTileId / cols);
        const c = playerTileId % cols;
        
        const neighbors = [];
        if (r > 0) neighbors.push(playerTileId - cols); // top
        if (r < rows - 1) neighbors.push(playerTileId + cols); // bottom
        if (c > 0) neighbors.push(playerTileId - 1); // left
        if (c < cols - 1) neighbors.push(playerTileId + 1); // right

        if (neighbors.includes(tileId)) {
            return true;
        }
    }
    return false;
  }, [board, gridSize]);
  
  return (
    <div
      className="grid gap-1.5 p-2 bg-black/20 rounded-lg shadow-inner"
      style={{
        gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${gridSize.rows}, minmax(0, 1fr))`,
        aspectRatio: `${gridSize.cols} / ${gridSize.rows}`
      }}
    >
      {board.map((tile) => {
        // Player can click on unowned tiles adjacent to their own,
        // or any AI-owned tile to start a duel.
        const isAdjacent = getIsAdjacentToPlayer(tile.id);
        const isClickable =
          playerTurn &&
          tile.owner !== 'player' &&
          (tile.owner === 'ai' || (tile.owner === 'unowned' && isAdjacent));
        
        return (
          <Tile
            key={tile.id}
            tile={tile}
            isClickable={isClickable}
            onClick={() => onTileClick(tile)}
          />
        );
      })}
    </div>
  );
}

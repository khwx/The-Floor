'use client';

import type { Player, TileData } from '@/lib/types';
import { Tile } from './tile';
import { useCallback } from 'react';

type GameBoardProps = {
  board: TileData[];
  gridSize: { rows: number; cols: number };
  onTileClick: (tile: TileData) => void;
  playerTurn: boolean;
  currentPlayer?: Player;
};

export function GameBoard({ board, gridSize, onTileClick, playerTurn, currentPlayer }: GameBoardProps) {
  
  const getIsAdjacentToPlayer = useCallback((tileId: number, player: Player): boolean => {
    const playerTiles = board.filter(t => t.owner === player).map(t => t.id);
    const { rows, cols } = gridSize;
    
    if (rows === 0 || cols === 0) return false;

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
  
  const getOpponent = (player: Player): Player => {
    switch (player) {
      case 'player1': return 'player2';
      case 'player2': return 'player1';
      case 'player3': return 'player4';
      case 'player4': return 'player3';
      case 'player': return 'ai';
      case 'ai': return 'player';
      default: return 'player';
    }
  };
   
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
        const activePlayer = currentPlayer || 'player';
        const opponent = getOpponent(activePlayer);

        const isAdjacent = getIsAdjacentToPlayer(tile.id, activePlayer);
        
        const isClickable =
          playerTurn &&
          tile.owner !== activePlayer &&
          (tile.owner === opponent || (tile.owner === 'unowned' && isAdjacent));
        
        return (
          <Tile
            key={tile.id}
            tile={tile}
            isClickable={isClickable}
            isAdjacent={isAdjacent && tile.owner === 'unowned'}
            onClick={() => onTileClick(tile)}
          />
        );
      })}
    </div>
  );
}

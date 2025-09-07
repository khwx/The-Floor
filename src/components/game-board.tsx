import type { TileData } from '@/lib/types';
import { Tile } from './tile';

type GameBoardProps = {
  board: TileData[];
  gridSize: { rows: number; cols: number };
  onTileClick: (tile: TileData) => void;
  playerTurn: boolean;
};

export function GameBoard({ board, gridSize, onTileClick, playerTurn }: GameBoardProps) {
  
  const getIsAdjacentToPlayer = (tileId: number): boolean => {
    const playerTiles = board.filter(t => t.owner === 'player').map(t => t.id);
    const { cols } = gridSize;
    const r = Math.floor(tileId / cols);
    const c = tileId % cols;
    
    const neighbors = [];
    if (r > 0) neighbors.push(tileId - cols); // top
    if (r < gridSize.rows - 1) neighbors.push(tileId + cols); // bottom
    if (c > 0) neighbors.push(tileId - 1); // left
    if (c < cols - 1) neighbors.push(tileId + 1); // right

    for (const neighborId of neighbors) {
      if (playerTiles.includes(neighborId)) {
        return true;
      }
    }
    return false;
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
        // Player can click on unowned tiles adjacent to their own,
        // or any AI-owned tile that is adjacent to one of their own.
        const isAdjacent = getIsAdjacentToPlayer(tile.id);
        const isClickable =
          playerTurn &&
          tile.owner !== 'player' &&
          isAdjacent;
        
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

    
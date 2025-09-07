import type { TileData } from '@/lib/types';
import { Tile } from './tile';

type GameBoardProps = {
  board: TileData[];
  gridSize: { rows: number; cols: number };
  onTileClick: (tile: TileData) => void;
  playerTurn: boolean;
};

export function GameBoard({ board, gridSize, onTileClick, playerTurn }: GameBoardProps) {
  const getAdjacentPlayerTiles = (tileId: number): boolean => {
    const playerTiles = board.filter(t => t.owner === 'player').map(t => t.id);
    const { cols } = gridSize;
    const r = Math.floor(tileId / cols);
    
    const neighbors = [
      tileId - cols, // top
      tileId + cols, // bottom
      tileId - 1,    // left
      tileId + 1,    // right
    ];

    for (const neighborId of neighbors) {
      if (playerTiles.includes(neighborId)) {
        const nRow = Math.floor(neighborId / cols);
         if (nRow === r || Math.abs(tileId - neighborId) === cols) {
            return true;
         }
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
        const isClickable =
          playerTurn &&
          tile.owner === 'unowned' &&
          getAdjacentPlayerTiles(tile.id);
        
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

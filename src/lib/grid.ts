/**
 * Calcula o tamanho da grelha (rows x cols) para um dado número de territórios.
 * Tenta formar um quadrado perfeito; senão, procura a melhor disposição retangular.
 */
export function getGridSize(territoryCount: number): { rows: number; cols: number } {
  if (territoryCount <= 0) return { rows: 0, cols: 0 };

  const sqrt = Math.sqrt(territoryCount);
  if (Number.isInteger(sqrt)) {
    return { rows: sqrt, cols: sqrt };
  }

  let cols = Math.ceil(sqrt);
  while (territoryCount % cols !== 0 && cols < territoryCount) {
    cols++;
  }

  if (territoryCount % cols !== 0) {
    return { rows: 1, cols: territoryCount };
  }

  return { rows: territoryCount / cols, cols };
}

/**
 * Retorna IDs dos vizinhos orthogonais (cima, baixo, esquerda, direita) de um tile.
 */
export function getNeighbors(tileId: number, cols: number, rows: number): number[] {
  if (cols === 0 || rows === 0) return [];
  const r = Math.floor(tileId / cols);
  const c = tileId % cols;
  const neighbors: number[] = [];
  if (r > 0) neighbors.push(tileId - cols);
  if (r < rows - 1) neighbors.push(tileId + cols);
  if (c > 0) neighbors.push(tileId - 1);
  if (c < cols - 1) neighbors.push(tileId + 1);
  return neighbors;
}

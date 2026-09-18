import { LEGEND, Tile } from "./tile.js";
import type { World } from "./types.js";
export function parseGrid(grid: string[]): {
  world: World;
  start: { x: number; y: number };
} {
  const height = grid.length,
    width = grid[0].length;
  const tiles: Tile[][] = [];
  let start = { x: 0, y: 0 };
  for (let row = 0; row < height; row++) {
    tiles[row] = [];
    for (let col = 0; col < width; col++) {
      const cell = grid[row][col];
      if (cell === "R") start = { x: col, y: row };
      tiles[row][col] = LEGEND[cell] ?? Tile.Floor;
    }
  }
  return { world: { width, height, tiles, collected: new Set() }, start };
}

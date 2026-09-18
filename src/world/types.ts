import type { Tile } from "./tile.js";
export interface World {
  width: number;
  height: number;
  tiles: Tile[][];
  collected: Set<string>;
}

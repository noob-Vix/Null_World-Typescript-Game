export const enum Tile {
  Floor = 0,
  Wall = 1,
  Crystal = 2,
  Terminal = 3,
  Hazard = 4,
  Door = 5,
}
export const LEGEND: Record<string, Tile> = {
  "#": Tile.Wall,
  ".": Tile.Floor,
  "*": Tile.Crystal,
  T: Tile.Terminal,
  "!": Tile.Hazard,
  D: Tile.Door,
  R: Tile.Floor,
};
const TILE_NAMES = ["floor", "wall", "crystal", "terminal", "hazard", "door"];
export function tileName(tile: Tile): string {
  return TILE_NAMES[tile] ?? "floor";
}

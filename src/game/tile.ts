export const enum Tile {
  Floor = 0,
  Wall = 1,
  Crystal = 2,
  Terminal = 3,
  Hazard = 4,
  Door = 5,
}
export const LEGEND: Record<string, number> = {
  "#": 1,
  ".": 0,
  "*": 2,
  T: 3,
  "!": 4,
  D: 5,
  R: 0,
};

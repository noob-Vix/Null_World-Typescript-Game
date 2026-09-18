import type { Player } from "./types.js";
export const mkPlayer = (x: number, y: number, energy = 100): Player => ({
  x,
  y,
  energy,
  state: "idle",
  collected: 0,
});

export type PState = "idle" | "walk" | "collect" | "error" | "success";

export interface Player {
  x: number;
  y: number;
  energy: number;
  state: PState;
  collected: number;
}
export const mkPlayer = (x: number, y: number, energy = 100): Player => ({
  x,
  y,
  energy,
  state: "idle",
  collected: 0,
});

export type PState = "idle" | "walk" | "collect" | "error" | "success";
export interface Player {
  x: number;
  y: number;
  energy: number;
  state: PState;
  collected: number;
}

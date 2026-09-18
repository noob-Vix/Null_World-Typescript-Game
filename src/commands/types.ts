export type Action =
  | { kind: "move"; dx: number; dy: number }
  | { kind: "collect" };
export interface Sense {
  here: string;
  up: string;
  down: string;
  left: string;
  right: string;
  energy: number;
  x: number;
  y: number;
}
export interface Api {
  moveUp(): void;
  moveDown(): void;
  moveLeft(): void;
  moveRight(): void;
  collect(): void;
  sense(): Sense;
  energy: number;
}
export interface RunResult {
  actions: Action[];
  error?: string;
  line?: number;
}
export interface Validation {
  ok: boolean;
  error?: string;
}

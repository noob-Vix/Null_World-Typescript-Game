import { step, tileName, type Action, type World } from "../game/world.js";
import type { Player } from "../game/player.js";
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
function at(world: World, x: number, y: number): string {
  if (x < 0 || y < 0 || x >= world.w || y >= world.h) return "void";
  return tileName(world.tiles[y][x]);
}
// Shadow simulation: every queued action is immediately applied to a scratch
// copy of the world/player, so sense() and energy read live values that match
// what playback will do. Mirrors the stop conditions in main.ts frame().
export function makeApi(q: Action[], world: World, p: Player): Api {
  let dead = false;
  const push = (a: Action) => {
    q.push(a);
    if (dead) return;
    const m = step(world, p, a);
    if (m.startsWith("hazard") || m.startsWith("energy")) dead = true;
  };
  const look = (): Sense => ({
    here: at(world, p.x, p.y),
    up: at(world, p.x, p.y - 1),
    down: at(world, p.x, p.y + 1),
    left: at(world, p.x - 1, p.y),
    right: at(world, p.x + 1, p.y),
    energy: p.energy,
    x: p.x,
    y: p.y,
  });
  return {
    moveUp: () => push({ kind: "move", dx: 0, dy: -1 }),
    moveDown: () => push({ kind: "move", dx: 0, dy: 1 }),
    moveLeft: () => push({ kind: "move", dx: -1, dy: 0 }),
    moveRight: () => push({ kind: "move", dx: 1, dy: 0 }),
    collect: () => push({ kind: "collect" }),
    sense: () => look(),
    get energy() {
      return p.energy;
    },
  };
}

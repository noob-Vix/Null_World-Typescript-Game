import { endsRun, step } from "../world/step.js";
import { tileName } from "../world/tile.js";
import type { Player } from "../player/types.js";
import type { World } from "../world/types.js";
import type { Action, Api, Sense } from "./types.js";
function at(world: World, x: number, y: number): string {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return "void";
  return tileName(world.tiles[y][x]);
}
// Shadow simulation: every queued action is immediately applied to a scratch
// copy of the world/player, so sense() and energy read live values that match
// what playback will do. Mirrors the stop conditions in main.ts frame().
export function makeApi(queue: Action[], world: World, player: Player): Api {
  let dead = false;
  const push = (action: Action) => {
    queue.push(action);
    if (dead) return;
    const result = step(world, player, action);
    if (endsRun(result)) dead = true;
  };
  const look = (): Sense => ({
    here: at(world, player.x, player.y),
    up: at(world, player.x, player.y - 1),
    down: at(world, player.x, player.y + 1),
    left: at(world, player.x - 1, player.y),
    right: at(world, player.x + 1, player.y),
    energy: player.energy,
    x: player.x,
    y: player.y,
  });
  return {
    moveUp: () => push({ kind: "move", dx: 0, dy: -1 }),
    moveDown: () => push({ kind: "move", dx: 0, dy: 1 }),
    moveLeft: () => push({ kind: "move", dx: -1, dy: 0 }),
    moveRight: () => push({ kind: "move", dx: 1, dy: 0 }),
    collect: () => push({ kind: "collect" }),
    sense: () => look(),
    get energy() {
      return player.energy;
    },
  };
}

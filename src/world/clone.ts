import type { World } from "./types.js";
export function cloneWorld(world: World): World {
  return {
    width: world.width,
    height: world.height,
    tiles: world.tiles.map((row) => row.slice()),
    collected: new Set(world.collected),
  };
}

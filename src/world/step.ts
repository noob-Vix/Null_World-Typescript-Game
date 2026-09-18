import { Tile } from "./tile.js";
import type { Action } from "../commands/types.js";
import type { Player } from "../player/types.js";
import type { World } from "./types.js";
export function step(world: World, player: Player, action: Action): string {
  if (action.kind === "move") {
    const nextX = player.x + action.dx,
      nextY = player.y + action.dy;
    if (nextX < 0 || nextY < 0 || nextX >= world.width || nextY >= world.height)
      return "bump: wall of void";
    const tile = world.tiles[nextY][nextX];
    if (tile === Tile.Wall) return "bump: blocked";
    if (tile === Tile.Door && player.energy <= 0)
      return "bump: gate locked (need energy>0)";
    player.x = nextX;
    player.y = nextY;
    player.energy -= 1;
    player.state = "walk";
    if (tile === Tile.Hazard) {
      player.state = "error";
      return "hazard: burned";
    }
    if (player.energy < 0) {
      player.state = "error";
      return "energy depleted";
    }
    return "moved";
  }
  const tile = world.tiles[player.y][player.x];
  if (tile === Tile.Crystal || tile === Tile.Terminal) {
    world.tiles[player.y][player.x] = Tile.Floor;
    player.collected++;
    player.state = "collect";
    return "collected";
  }
  player.state = "error";
  return "collect: nothing here";
}

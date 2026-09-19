import { Tile } from "./tile.js";
import type { Player } from "../player/types.js";
import type { World } from "./types.js";
// Manhattan distance: the flashlight around the robot. No radius = full map.
export function isVisible(
  x: number,
  y: number,
  playerX: number,
  playerY: number,
  radius?: number,
): boolean {
  if (radius === undefined) return true;
  return Math.abs(x - playerX) + Math.abs(y - playerY) <= radius;
}
export function render(
  ctx: CanvasRenderingContext2D,
  world: World,
  player: Player,
  time: number,
  viewRadius?: number,
) {
  const cellWidth = ctx.canvas.width / world.width,
    cellHeight = ctx.canvas.height / world.height;
  ctx.fillStyle = "#070b16";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let y = 0; y < world.height; y++)
    for (let x = 0; x < world.width; x++) {
      if (!isVisible(x, y, player.x, player.y, viewRadius)) {
        ctx.fillStyle = "#05070f";
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        continue;
      }
      const tile = world.tiles[y][x];
      ctx.fillStyle = "#0d1330";
      ctx.fillRect(x * cellWidth + 1, y * cellHeight + 1, cellWidth - 2, cellHeight - 2);
      if (tile === Tile.Wall) {
        ctx.fillStyle = "#24306b";
        ctx.fillRect(x * cellWidth + 1, y * cellHeight + 1, cellWidth - 2, cellHeight - 2);
      }
      if (tile === Tile.Crystal) {
        ctx.fillStyle = "#37e6ff";
        ctx.fillRect(x * cellWidth + cellWidth * 0.3, y * cellHeight + cellHeight * 0.2, cellWidth * 0.4, cellHeight * 0.6);
      }
      if (tile === Tile.Terminal) {
        ctx.fillStyle = "#7dff9a";
        ctx.fillRect(x * cellWidth + cellWidth * 0.2, y * cellHeight + cellHeight * 0.3, cellWidth * 0.6, cellHeight * 0.4);
      }
      if (tile === Tile.Hazard) {
        ctx.fillStyle = "#ff3b5c";
        ctx.fillRect(x * cellWidth + 1, y * cellHeight + 1, cellWidth - 2, cellHeight - 2);
      }
      if (tile === Tile.Door) {
        ctx.fillStyle = "#8a6bff";
        ctx.fillRect(x * cellWidth + 1, y * cellHeight + 1, cellWidth - 2, cellHeight - 2);
      }
    }
  const bob = player.state === "idle" ? Math.sin(time / 300) * 2 : 0;
  ctx.fillStyle = player.state === "error" ? "#ff3b5c" : "#ff9f2e";
  ctx.fillRect(player.x * cellWidth + 4, player.y * cellHeight + 4 + bob, cellWidth - 8, cellHeight - 8);
  ctx.fillStyle = "#0a0e1a";
  ctx.fillRect(player.x * cellWidth + cellWidth * 0.55, player.y * cellHeight + cellHeight * 0.35 + bob, 6, 6);
}

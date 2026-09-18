import { Tile, LEGEND } from "./tile.js";
import type { Player } from "./player.js";
export interface World {
  w: number;
  h: number;
  tiles: number[][];
  collected: Set<string>;
}
export type Action =
  | { kind: "move"; dx: number; dy: number }
  | { kind: "collect" };
export function parseGrid(grid: string[]): {
  world: World;
  start: { x: number; y: number };
} {
  const h = grid.length,
    w = grid[0].length;
  const tiles: number[][] = [];
  let start = { x: 0, y: 0 };
  for (let y = 0; y < h; y++) {
    tiles[y] = [];
    for (let x = 0; x < w; x++) {
      const ch = grid[y][x];
      if (ch === "R") start = { x, y };
      tiles[y][x] = LEGEND[ch] ?? 0;
    }
  }
  return { world: { w, h, tiles, collected: new Set() }, start };
}
export function step(world: World, p: Player, a: Action): string {
  if (a.kind === "move") {
    const nx = p.x + a.dx,
      ny = p.y + a.dy;
    if (nx < 0 || ny < 0 || nx >= world.w || ny >= world.h)
      return "bump: wall of void";
    const t = world.tiles[ny][nx];
    if (t === Tile.Wall) return "bump: blocked";
    if (t === Tile.Door && p.energy <= 0)
      return "bump: gate locked (need energy>0)";
    p.x = nx;
    p.y = ny;
    p.energy -= 1;
    p.state = "walk";
    if (t === Tile.Hazard) {
      p.state = "error";
      return "hazard: burned";
    }
    if (p.energy < 0) {
      p.state = "error";
      return "energy depleted";
    }
    return "moved";
  }
  const t = world.tiles[p.y][p.x];
  if (t === Tile.Crystal || t === Tile.Terminal) {
    world.tiles[p.y][p.x] = 0;
    p.collected++;
    p.state = "collect";
    return "collected";
  }
  p.state = "error";
  return "collect: nothing here";
}
const TILE_NAMES = ["floor", "wall", "crystal", "terminal", "hazard", "door"];
export function tileName(t: number): string {
  return TILE_NAMES[t] ?? "floor";
}
export function cloneWorld(world: World): World {
  return {
    w: world.w,
    h: world.h,
    tiles: world.tiles.map((r) => r.slice()),
    collected: new Set(world.collected),
  };
}
export function draw(
  ctx: CanvasRenderingContext2D,
  world: World,
  p: Player,
  t: number,
) {
  const cw = ctx.canvas.width / world.w,
    ch = ctx.canvas.height / world.h;
  ctx.fillStyle = "#070b16";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let y = 0; y < world.h; y++)
    for (let x = 0; x < world.w; x++) {
      const t2 = world.tiles[y][x];
      ctx.fillStyle = "#0d1330";
      ctx.fillRect(x * cw + 1, y * ch + 1, cw - 2, ch - 2);
      if (t2 === 1) {
        ctx.fillStyle = "#24306b";
        ctx.fillRect(x * cw + 1, y * ch + 1, cw - 2, ch - 2);
      }
      if (t2 === 2) {
        ctx.fillStyle = "#37e6ff";
        ctx.fillRect(x * cw + cw * 0.3, y * ch + ch * 0.2, cw * 0.4, ch * 0.6);
      }
      if (t2 === 3) {
        ctx.fillStyle = "#7dff9a";
        ctx.fillRect(x * cw + cw * 0.2, y * ch + ch * 0.3, cw * 0.6, ch * 0.4);
      }
      if (t2 === 4) {
        ctx.fillStyle = "#ff3b5c";
        ctx.fillRect(x * cw + 1, y * ch + 1, cw - 2, ch - 2);
      }
      if (t2 === 5) {
        ctx.fillStyle = "#8a6bff";
        ctx.fillRect(x * cw + 1, y * ch + 1, cw - 2, ch - 2);
      }
    }
  const bob = p.state === "idle" ? Math.sin(t / 300) * 2 : 0;
  ctx.fillStyle = p.state === "error" ? "#ff3b5c" : "#ff9f2e";
  ctx.fillRect(p.x * cw + 4, p.y * ch + 4 + bob, cw - 8, ch - 8);
  ctx.fillStyle = "#0a0e1a";
  ctx.fillRect(p.x * cw + cw * 0.55, p.y * ch + ch * 0.35 + bob, 6, 6);
}

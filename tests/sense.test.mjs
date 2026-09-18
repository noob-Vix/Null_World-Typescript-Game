import test, { before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = "/tmp/nullworld-phase1";
let world, playerMod, executor, missions;

before(() => {
  execSync(`npx tsc --noEmit false --outDir ${out}`, { cwd: root, stdio: "pipe" });
});

test("sense() sees the crystal after queued moves", async () => {
  world = await import(pathToFileURL(path.join(out, "game/world.js")).href);
  playerMod =
    await import(pathToFileURL(path.join(out, "game/player.js")).href);
  executor =
    await import(pathToFileURL(path.join(out, "scripting/executor.js")).href);
  missions =
    await import(pathToFileURL(path.join(out, "game/mission.js")).href);
  const { world: w, start } = world.parseGrid(["R.*"]);
  const p = playerMod.mkPlayer(start.x, start.y, 100);
  const r = executor.runCode(
    "moveRight(); moveRight(); if (sense().here === 'crystal') { collect(); }",
    w,
    p,
  );
  assert.equal(r.error, undefined);
  assert.equal(r.actions.length, 3);
  assert.equal(r.actions[2].kind, "collect");
});

test("sense() does not see the crystal too early", () => {
  const { world: w, start } = world.parseGrid(["R.*"]);
  const p = playerMod.mkPlayer(start.x, start.y, 100);
  const r = executor.runCode(
    "moveRight(); if (sense().here === 'crystal') { collect(); }",
    w,
    p,
  );
  assert.equal(r.actions.length, 1);
});

test("sense().energy is live, not the RUN-time snapshot", () => {
  const { world: w, start } = world.parseGrid(["R...*"]);
  const p = playerMod.mkPlayer(start.x, start.y, 100);
  const r = executor.runCode(
    "moveRight(); if (sense().energy < 100) { collect(); }",
    w,
    p,
  );
  assert.equal(r.actions.length, 2);
});

test("door opens with energy, locks at zero", () => {
  const g = ["R.D.*"];
  const a = world.parseGrid(g);
  const p1 = playerMod.mkPlayer(1, 0, 5);
  const m1 = world.step(a.world, p1, { kind: "move", dx: 1, dy: 0 });
  assert.equal(m1, "moved");
  const b = world.parseGrid(g);
  const p0 = playerMod.mkPlayer(1, 0, 0);
  const m0 = world.step(b.world, p0, { kind: "move", dx: 1, dy: 0 });
  assert.ok(m0.startsWith("bump"));
});

test("mission 06 full solution wins end to end", () => {
  const m = missions.MISSIONS.find((x) => x.id === "06");
  const { world: w, start } = world.parseGrid(m.grid);
  const p = playerMod.mkPlayer(start.x, start.y, m.energy);
  const sol =
    "if (energy > 0) { moveRight(); moveRight(); moveRight(); moveRight(); collect(); }";
  const r = executor.runCode(sol, w, p);
  assert.equal(r.error, undefined);
  for (const a of r.actions) {
    const msg = world.step(w, p, a);
    if (msg.startsWith("hazard") || msg.startsWith("energy")) break;
  }
  assert.ok(p.collected >= 1);
});

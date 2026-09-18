import test, { before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = "/tmp/nullworld-phase1";
let parse, stepMod, playerMod, executor, missions;

before(() => {
  execSync(`npx tsc --noEmit false --outDir ${out}`, { cwd: root, stdio: "pipe" });
});

async function load() {
  if (parse) return;
  parse = await import(pathToFileURL(path.join(out, "world/parse.js")).href);
  stepMod = await import(pathToFileURL(path.join(out, "world/step.js")).href);
  playerMod =
    await import(pathToFileURL(path.join(out, "player/player.js")).href);
  executor =
    await import(pathToFileURL(path.join(out, "commands/executor.js")).href);
  missions =
    await import(pathToFileURL(path.join(out, "manager/missions.js")).href);
}

test("sense() sees the crystal after queued moves", async () => {
  await load();
  const { world: gameWorld, start } = parse.parseGrid(["R.*"]);
  const player = playerMod.mkPlayer(start.x, start.y, 100);
  const result = executor.runCode(
    "moveRight(); moveRight(); if (sense().here === 'crystal') { collect(); }",
    gameWorld,
    player,
  );
  assert.equal(result.error, undefined);
  assert.equal(result.actions.length, 3);
  assert.equal(result.actions[2].kind, "collect");
});

test("sense() does not see the crystal too early", async () => {
  await load();
  const { world: gameWorld, start } = parse.parseGrid(["R.*"]);
  const player = playerMod.mkPlayer(start.x, start.y, 100);
  const result = executor.runCode(
    "moveRight(); if (sense().here === 'crystal') { collect(); }",
    gameWorld,
    player,
  );
  assert.equal(result.actions.length, 1);
});

test("sense().energy is live, not the RUN-time snapshot", async () => {
  await load();
  const { world: gameWorld, start } = parse.parseGrid(["R...*"]);
  const player = playerMod.mkPlayer(start.x, start.y, 100);
  const result = executor.runCode(
    "moveRight(); if (sense().energy < 100) { collect(); }",
    gameWorld,
    player,
  );
  assert.equal(result.actions.length, 2);
});

test("door opens with energy, locks at zero", async () => {
  await load();
  const grid = ["R.D.*"];
  const charged = parse.parseGrid(grid);
  const chargedPlayer = playerMod.mkPlayer(1, 0, 5);
  const opened = stepMod.step(charged.world, chargedPlayer, { kind: "move", dx: 1, dy: 0 });
  assert.equal(opened, "moved");
  const drained = parse.parseGrid(grid);
  const drainedPlayer = playerMod.mkPlayer(1, 0, 0);
  const blocked = stepMod.step(drained.world, drainedPlayer, { kind: "move", dx: 1, dy: 0 });
  assert.ok(blocked.startsWith("bump"));
});

test("mission 06 full solution wins end to end", async () => {
  await load();
  const mission = missions.MISSIONS.find((entry) => entry.id === "06");
  const { world: gameWorld, start } = parse.parseGrid(mission.grid);
  const player = playerMod.mkPlayer(start.x, start.y, mission.energy);
  const solution =
    "if (energy > 0) { moveRight(); moveRight(); moveRight(); moveRight(); collect(); }";
  const result = executor.runCode(solution, gameWorld, player);
  assert.equal(result.error, undefined);
  for (const action of result.actions) {
    const stepMessage = stepMod.step(gameWorld, player, action);
    if (stepMessage.startsWith("hazard") || stepMessage.startsWith("energy")) break;
  }
  assert.ok(player.collected >= 1);
});

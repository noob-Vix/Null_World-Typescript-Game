import test, { before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = "/tmp/nullworld-phase1";
let stepMod, parse, playerMod, executor;

before(() => {
  execSync(`npx tsc --noEmit false --outDir ${out}`, { cwd: root, stdio: "pipe" });
});

async function load() {
  if (stepMod) return;
  stepMod = await import(pathToFileURL(path.join(out, "world/step.js")).href);
  parse = await import(pathToFileURL(path.join(out, "world/parse.js")).href);
  playerMod =
    await import(pathToFileURL(path.join(out, "player/player.js")).href);
  executor =
    await import(pathToFileURL(path.join(out, "commands/executor.js")).href);
}

test("bumps end the run, moves and collects do not", async () => {
  await load();
  assert.equal(stepMod.endsRun("bump: blocked"), true);
  assert.equal(stepMod.endsRun("bump: gate locked (need energy>0)"), true);
  assert.equal(stepMod.endsRun("bump: wall of void"), true);
  assert.equal(stepMod.endsRun("hazard: burned"), true);
  assert.equal(stepMod.endsRun("energy depleted"), true);
  assert.equal(stepMod.endsRun("moved"), false);
  assert.equal(stepMod.endsRun("collected"), false);
  assert.equal(stepMod.endsRun("collect: nothing here"), false);
});

test("shadow freezes after a fatal step, so sense() matches playback", async () => {
  await load();
  const { world: gameWorld, start } = parse.parseGrid(["R......"]);
  const player = playerMod.mkPlayer(start.x, start.y, 3);
  const result = executor.runCode(
    "moveRight();moveRight();moveRight();moveRight();moveRight();moveRight();" +
      "if (sense().energy === -1) { collect(); }",
    gameWorld,
    player,
  );
  assert.equal(result.actions.length, 7);
});

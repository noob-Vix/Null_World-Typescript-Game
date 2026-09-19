import test, { before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = "/tmp/nullworld-phase1";
let render, missions;

before(() => {
  execSync(`npx tsc --noEmit false --outDir ${out}`, { cwd: root, stdio: "pipe" });
});

async function load() {
  if (render) return;
  render =
    await import(pathToFileURL(path.join(out, "world/render.js")).href);
  missions =
    await import(pathToFileURL(path.join(out, "manager/missions.js")).href);
}

test("fog hides tiles outside the sense radius", async () => {
  await load();
  assert.equal(render.isVisible(2, 0, 0, 0, 2), true);
  assert.equal(render.isVisible(3, 0, 0, 0, 2), false);
  assert.equal(render.isVisible(1, 1, 0, 0, 2), true);
  assert.equal(render.isVisible(0, 0, 0, 0, 2), true);
});

test("no radius means the whole map is visible", async () => {
  await load();
  assert.equal(render.isVisible(99, 99, 0, 0, undefined), true);
});

test("Mission 11 Blackout is a medium fog maze", async () => {
  await load();
  const blackout = missions.MISSIONS.find((entry) => entry.id === "11");
  assert.ok(blackout, "Mission 11 must exist");
  assert.equal(blackout.viewRadius, 2);
  assert.equal(blackout.difficulty, "medium");
  assert.ok(blackout.tags.includes("maze"));
});

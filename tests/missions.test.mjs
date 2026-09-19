import test, { before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = "/tmp/nullworld-phase1";
let missions;

before(() => {
  execSync(`npx tsc --noEmit false --outDir ${out}`, { cwd: root, stdio: "pipe" });
});

async function load() {
  if (missions) return;
  missions =
    await import(pathToFileURL(path.join(out, "manager/missions.js")).href);
}

test("every mission has a LeetCode-style difficulty and tags", async () => {
  await load();
  assert.ok(missions.MISSIONS.length >= 10, "campaign must exist");
  for (const mission of missions.MISSIONS) {
    assert.ok(
      ["easy", "medium", "hard"].includes(mission.difficulty),
      `${mission.id} needs difficulty easy|medium|hard`,
    );
    assert.ok(
      Array.isArray(mission.tags) && mission.tags.length > 0,
      `${mission.id} needs at least one tag`,
    );
  }
});

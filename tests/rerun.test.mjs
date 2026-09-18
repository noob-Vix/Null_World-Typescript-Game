import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
// Regression for the rerun-desync bug: pressing RUN after a failed attempt
// reused the dirty world/player, so correct code failed. The RUN handler must
// reset the level (load) BEFORE building the queue (runCode).
const source = fs.readFileSync(
  new URL("../src/main.ts", import.meta.url),
  "utf8",
);
test("RUN resets the level before building the queue", () => {
  const handlerIndex = source.indexOf('getElementById("btnRun")');
  assert.ok(handlerIndex >= 0, "RUN handler must exist");
  const handler = source.slice(handlerIndex);
  const resetIndex = handler.indexOf("load(currentMission.id)");
  const runIndex = handler.indexOf("runCode(");
  assert.ok(resetIndex >= 0, "RUN handler must call load(currentMission.id)");
  assert.ok(runIndex >= 0, "RUN handler must call runCode(");
  assert.ok(
    resetIndex < runIndex,
    "load(currentMission.id) must come before runCode( in the RUN handler",
  );
  assert.ok(
    handler.includes("codeInput.value = code"),
    "RUN handler must restore the user code after reset",
  );
});

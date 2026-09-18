import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
// Regression for the rerun-desync bug: pressing RUN after a failed attempt
// reused the dirty world/player, so correct code failed. The RUN handler must
// reset the level (load) BEFORE building the queue (runCode).
const src = fs.readFileSync(
  new URL("../src/main.ts", import.meta.url),
  "utf8",
);
test("RUN resets the level before building the queue", () => {
  const at = src.indexOf('getElementById("btnRun")');
  assert.ok(at >= 0, "RUN handler must exist");
  const handler = src.slice(at);
  const resetAt = handler.indexOf("load(cur.id)");
  const runAt = handler.indexOf("runCode(");
  assert.ok(resetAt >= 0, "RUN handler must call load(cur.id)");
  assert.ok(runAt >= 0, "RUN handler must call runCode(");
  assert.ok(
    resetAt < runAt,
    "load(cur.id) must come before runCode( in the RUN handler",
  );
  assert.ok(
    handler.includes("ta.value = code"),
    "RUN handler must restore the user code after reset",
  );
});

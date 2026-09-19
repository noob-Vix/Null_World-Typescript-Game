import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
// Terminal track wiring: tabs row exists, main branches RUN into the
// test worker, verdicts render per case, wins save + show powers.
const mainSource = fs.readFileSync(
  new URL("../src/main.ts", import.meta.url),
  "utf8",
);
const pageSource = fs.readFileSync(
  new URL("../index.html", import.meta.url),
  "utf8",
);
test("terminal tabs row exists and main wires the test worker", () => {
  assert.ok(
    pageSource.includes('id="terminalTabs"'),
    "page needs a terminal tabs row",
  );
  assert.ok(mainSource.includes("TERMINALS"), "main must list terminals");
  assert.ok(
    mainSource.includes("runTerminalTests("),
    "RUN must branch into the test worker",
  );
  assert.ok(
    mainSource.includes("saveTerminalDone("),
    "accepted solutions must save",
  );
  assert.ok(
    mainSource.includes("powersText"),
    "win must show what the terminal powers",
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
// Play / Pause / Reset model: RUN always starts fresh, Pause freezes
// mid-animation without resetting, empty programs idle instead of failing.
const mainSource = fs.readFileSync(
  new URL("../src/main.ts", import.meta.url),
  "utf8",
);
const pageSource = fs.readFileSync(
  new URL("../index.html", import.meta.url),
  "utf8",
);
test("pause button exists and toggles without resetting", () => {
  assert.ok(pageSource.includes('id="btnPause"'), "page needs a pause button");
  const at = mainSource.indexOf("pauseButton.onclick");
  assert.ok(at >= 0, "main must wire the pause button");
  const end = mainSource.indexOf('btnReset"', at);
  const handler = mainSource.slice(at, end);
  assert.ok(handler.includes("playing = false"), "pause must freeze playback");
  assert.ok(!handler.includes("load("), "pause must not reset the level");
});
test("empty programs idle instead of failing", () => {
  assert.ok(
    mainSource.includes("drone is idle"),
    "empty queue must log an idle message",
  );
  assert.ok(
    mainSource.includes('state = "idle"'),
    "empty queue must leave the robot idle",
  );
});

import test, { before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = "/tmp/nullworld-phase1";
let editor, parse, playerMod, executor;

before(() => {
  execSync(`npx tsc --noEmit false --outDir ${out}`, { cwd: root, stdio: "pipe" });
  return (async () => {
    editor = await import(pathToFileURL(path.join(out, "ui/highlight.js")).href);
    parse = await import(pathToFileURL(path.join(out, "world/parse.js")).href);
    playerMod =
      await import(pathToFileURL(path.join(out, "player/player.js")).href);
    executor =
      await import(
        pathToFileURL(path.join(out, "commands/executor.js")).href
      );
  })();
});

test("highlight colors robot commands", () => {
  const h = editor.highlight("moveRight(); collect();");
  assert.ok(h.includes('<span class="tk-f">moveRight</span>'));
  assert.ok(h.includes('<span class="tk-f">collect</span>'));
});

test("highlight colors keywords, numbers, comments", () => {
  const h = editor.highlight("for (let i = 0; i < 3; i++) {} // loop");
  assert.ok(h.includes('<span class="tk-k">for</span>'));
  assert.ok(h.includes('<span class="tk-n">3</span>'));
  assert.ok(h.includes('<span class="tk-c">// loop</span>'));
});

test("highlight escapes HTML instead of injecting it", () => {
  const h = editor.highlight("if (a < b) {}");
  assert.ok(h.includes("&lt;"));
  assert.ok(!h.includes("<b>"));
});

test("completeWord finishes unique prefixes", () => {
  assert.equal(editor.completeWord("moveR"), "ight()");
  assert.equal(editor.completeWord("xyz"), null);
  assert.equal(editor.completeWord(""), null);
});

test("runtime errors report the user line", () => {
  const { world: gameWorld, start } = parse.parseGrid(["R..*."]);
  const player = playerMod.mkPlayer(start.x, start.y, 100);
  const result = executor.runCode("moveRight();\nnope();", gameWorld, player);
  assert.ok(result.error);
  assert.equal(result.line, 2);
});

test("queue-cap errors carry no line", () => {
  const { world: gameWorld, start } = parse.parseGrid(["R..*."]);
  const player = playerMod.mkPlayer(start.x, start.y, 100);
  const result = executor.runCode(
    "for (let i = 0; i < 2000; i++) { moveRight(); }",
    gameWorld,
    player,
  );
  assert.ok(result.error);
  assert.equal(result.line, undefined);
});

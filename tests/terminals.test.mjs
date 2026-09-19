import test, { before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = "/tmp/nullworld-phase1";
let runner, manager;

before(() => {
  execSync(`npx tsc --noEmit false --outDir ${out}`, { cwd: root, stdio: "pipe" });
});

// Run the real worker function with faked globals and feed it one message.
async function runWorker(code, functionName, tests) {
  if (!runner) {
    runner = await import(
      pathToFileURL(path.join(out, "commands/test-runner.js")).href
    );
    manager = await import(
      pathToFileURL(path.join(out, "manager/terminals.js")).href
    );
  }
  let answered = null;
  const g = globalThis;
  g.postMessage = (message) => {
    answered = message;
  };
  runner.terminalWorkerMain();
  const handler = g.onmessage;
  try {
    handler({ data: { code, functionName, tests } });
  } finally {
    delete g.onmessage;
    delete g.postMessage;
  }
  return answered;
}

test("stableStringify ignores object key order, arrays stay ordered", async () => {
  await runWorker("function f() {}", "f", []);
  assert.equal(
    runner.stableStringify({ a: 1, b: 2 }),
    runner.stableStringify({ b: 2, a: 1 }),
  );
  assert.notEqual(
    runner.stableStringify([1, 2]),
    runner.stableStringify([2, 1]),
  );
});

test("correct solution passes all cases", async () => {
  const answer = await runWorker(
    "export function dedupe(ids) { return [...new Set(ids)]; }",
    "dedupe",
    [
      { args: [[3, 1, 3, 2, 1]], expected: [3, 1, 2] },
      { args: [[]], expected: [] },
    ],
  );
  assert.ok(!answer.fatal, answer.fatal);
  assert.equal(answer.results.length, 2);
  assert.ok(answer.results.every((r) => r.passed));
});

test("wrong answer reports got, runtime error reports error", async () => {
  const wrong = await runWorker(
    "function dedupe(ids) { return ids; }",
    "dedupe",
    [{ args: [[1, 1, 2]], expected: [1, 2] }],
  );
  assert.equal(wrong.results[0].passed, false);
  assert.deepEqual(wrong.results[0].got, [1, 1, 2]);
  const broken = await runWorker(
    "function dedupe(ids) { return ids.nope(); }",
    "dedupe",
    [{ args: [[1]], expected: [1] }],
  );
  assert.equal(broken.results[0].passed, false);
  assert.ok(broken.results[0].error);
});

test("missing function reports fatal, not a hang", async () => {
  const answer = await runWorker("const x = 1;", "dedupe", [
    { args: [[1]], expected: [1] },
  ]);
  assert.ok(answer.fatal);
});

test("typescript annotations are stripped before running", async () => {
  const answer = await runWorker(
    "export function dedupe(ids: number[]): number[] { return [...new Set(ids)]; }",
    "dedupe",
    [{ args: [[2, 2, 1]], expected: [2, 1] }],
  );
  assert.ok(!answer.fatal, answer.fatal);
  assert.ok(answer.results.every((r) => r.passed));
});

test("three Easy array+hash terminals ship with stubs and tests", async () => {
  await runWorker("function f() {}", "f", []);
  assert.equal(manager.TERMINALS.length, 3);
  for (const terminal of manager.TERMINALS) {
    assert.equal(terminal.difficulty, "easy");
    assert.ok(terminal.tags.length > 0);
    assert.ok(terminal.stub.includes(terminal.functionName));
    assert.ok(terminal.visibleTests.length >= 2);
    assert.ok(terminal.hiddenTests.length >= 1);
  }
});

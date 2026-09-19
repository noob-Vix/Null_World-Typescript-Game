import type { TerminalMission, TerminalTest } from "../manager/types.js";
import { stripTypes } from "./strip-types.js";
export interface CaseResult {
  index: number;
  passed: boolean;
  got?: unknown;
  error?: string;
}
export interface WorkerAnswer {
  fatal?: string;
  results: CaseResult[];
}
export interface WorkerJob {
  code: string;
  functionName: string;
  tests: TerminalTest[];
}
// Key order must not matter ([3,1] vs [1,3] as object keys is the same
// answer), but array order must. Plain JSON.stringify gets the second
// right and the first wrong, so sort object keys by hand.
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object")
    return JSON.stringify(value) ?? "undefined";
  if (Array.isArray(value))
    return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}
// Runs inside the Web Worker. Uses only globals + stableStringify, so the
// source can ship to the worker via buildWorkerSource() below. Reads
// everything through globalThis so node tests can drive it directly too.
export function terminalWorkerMain(): void {
  const scope = globalThis as unknown as {
    onmessage: ((event: { data: WorkerJob }) => void) | null;
    postMessage: (message: WorkerAnswer) => void;
  };
  scope.onmessage = (event) => {
    const { code, functionName, tests } = event.data;
    const plain = stripTypes(code.replace(/^\s*export\s+/gm, ""));
    let solve: (...args: unknown[]) => unknown;
    try {
      const factory = new Function(
        `${plain}\nreturn ${functionName};`,
      ) as () => unknown;
      const found = factory();
      if (typeof found !== "function")
        throw new Error(`${functionName} is not defined`);
      solve = found as (...args: unknown[]) => unknown;
    } catch (thrown) {
      scope.postMessage({
        fatal: thrown instanceof Error ? thrown.message : String(thrown),
        results: [],
      });
      return;
    }
    const results = tests.map((testCase, index) => {
      try {
        const got = solve(...testCase.args);
        const passed =
          stableStringify(got) === stableStringify(testCase.expected);
        return passed ? { index, passed } : { index, passed, got };
      } catch (thrown) {
        return {
          index,
          passed: false,
          error: thrown instanceof Error ? thrown.message : String(thrown),
        };
      }
    });
    scope.postMessage({ results });
  };
}
export function buildWorkerSource(): string {
  return (
    `${stripTypes.toString()}\n` +
    `${stableStringify.toString()}\n(${terminalWorkerMain.toString()})()`
  );
}
export interface TerminalRun {
  cancel(): void;
  done: Promise<WorkerAnswer>;
}
// Tests always run off-thread: a never-ending solution burns the 2s budget
// and comes back "Too slow" instead of freezing the tab.
export function runTerminalTests(
  code: string,
  mission: TerminalMission,
  timeoutMs = 2000,
): TerminalRun {
  const source = buildWorkerSource();
  const worker = new Worker(
    URL.createObjectURL(new Blob([source], { type: "text/javascript" })),
  );
  let settled = false;
  let resolveDone!: (answer: WorkerAnswer) => void;
  const done = new Promise<WorkerAnswer>((resolve) => {
    resolveDone = resolve;
  });
  const finish = (answer: WorkerAnswer) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    worker.terminate();
    resolveDone(answer);
  };
  const timer = setTimeout(
    () => finish({ fatal: "Too slow — timed out.", results: [] }),
    timeoutMs,
  );
  worker.onmessage = (event: MessageEvent<WorkerAnswer>) =>
    finish(event.data);
  worker.onerror = () =>
    finish({ fatal: "Test worker failed to start.", results: [] });
  worker.postMessage({
    code,
    functionName: mission.functionName,
    tests: [...mission.visibleTests, ...mission.hiddenTests],
  });
  return { cancel: () => finish({ fatal: "Stopped.", results: [] }), done };
}

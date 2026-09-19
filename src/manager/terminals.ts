import type { TerminalMission } from "./types.js";
export const TERMINALS: TerminalMission[] = [
  {
    id: "T1",
    title: "Dedupe the loot manifest",
    briefing:
      "The manifest lists every pickup, copies included. Return each id once, order kept.",
    difficulty: "easy",
    tags: ["arrays", "hash set"],
    hint: "A Set remembers what it has seen.",
    stub: "export function dedupe(ids: number[]): number[] {\n  // your code here\n  return [];\n}\n",
    functionName: "dedupe",
    visibleTests: [
      { args: [[3, 1, 3, 2, 1]], expected: [3, 1, 2] },
      { args: [[]], expected: [] },
    ],
    hiddenTests: [
      { args: [[5, 5, 5]], expected: [5] },
      { args: [[1, 2, 3]], expected: [1, 2, 3] },
    ],
    powersText: "Sector gate 02 opens.",
  },
  {
    id: "T2",
    title: "Frequency audit",
    briefing:
      "Find every id that occurs exactly once. Counting is the whole job.",
    difficulty: "easy",
    tags: ["arrays", "hash map"],
    hint: "Count first, filter second.",
    stub: "export function rares(ids: number[]): number[] {\n  // your code here\n  return [];\n}\n",
    functionName: "rares",
    visibleTests: [
      { args: [[4, 4, 7, 9, 9]], expected: [7] },
      { args: [[]], expected: [] },
    ],
    hiddenTests: [
      { args: [[1, 1, 2, 2]], expected: [] },
      { args: [[-1, -1, 0]], expected: [0] },
    ],
    powersText: "Crystal values revealed on the map.",
  },
  {
    id: "T3",
    title: "Reverse the patrol log",
    briefing:
      "The patrol log reads backwards. Return it reversed, longest trip first.",
    difficulty: "easy",
    tags: ["arrays", "two pointers"],
    hint: "Swap the ends toward the middle.",
    stub: "export function reverseLog(log: string[]): string[] {\n  // your code here\n  return [];\n}\n",
    functionName: "reverseLog",
    visibleTests: [
      { args: [["a", "b", "c"]], expected: ["c", "b", "a"] },
      { args: [[]], expected: [] },
    ],
    hiddenTests: [
      { args: [["x"]], expected: ["x"] },
      { args: [["a", "b", "c", "d"]], expected: ["d", "c", "b", "a"] },
    ],
    powersText: "A chaser powers down.",
  },
];

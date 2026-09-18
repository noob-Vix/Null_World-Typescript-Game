import type { Mission } from "../manager/types.js";
// Each rule returns an error message or undefined. Add new rules here;
// validate() below just runs them in order.
export function noInfiniteLoops(code: string): string | undefined {
  if (
    /while\s*\(\s*(true|1)\s*\)/.test(code) ||
    /for\s*\(\s*;\s*;\s*\)/.test(code)
  )
    return "infinite loop blocked in prototype — use for(i<n)";
}
export function gateNeedsIf(mission: Mission, code: string): string | undefined {
  if (mission.id === "06" && !/\bif\s*\(/.test(code))
    return "The Gate needs if (energy > 0) — see Hint";
}
export function noBlockedApis(code: string): string | undefined {
  if (
    /fetch|XMLHttpRequest|import\s|require\(|process|localStorage|document|window/.test(
      code,
    )
  )
    return "blocked API — only move/collect/energy + JS basics";
}

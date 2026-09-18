import type { Mission } from "../game/mission.js";
export function validate(
  code: string,
  m: Mission,
): { ok: boolean; error?: string } {
  if (/while\s*\(\s*(true|1)\s*\)/.test(code) || /for\s*\(\s*;\s*;\s*\)/.test(code))
    return { ok: false, error: "infinite loop blocked in prototype — use for(i<n)" };
  if (m.id === "06" && !/\bif\s*\(/.test(code))
    return { ok: false, error: "The Gate needs if (energy > 0) — see Hint" };
  if (
    /fetch|XMLHttpRequest|import\s|require\(|process|localStorage|document|window/.test(
      code,
    )
  )
    return {
      ok: false,
      error: "blocked API — only move/collect/energy + JS basics",
    };
  return { ok: true };
}

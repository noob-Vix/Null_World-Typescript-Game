import type { Mission } from "../manager/types.js";
import type { Validation } from "./types.js";
import { gateNeedsIf, noBlockedApis, noInfiniteLoops } from "./rules.js";
export function validate(code: string, mission: Mission): Validation {
  const firstError =
    noInfiniteLoops(code) ?? gateNeedsIf(mission, code) ?? noBlockedApis(code);
  return firstError ? { ok: false, error: firstError } : { ok: true };
}

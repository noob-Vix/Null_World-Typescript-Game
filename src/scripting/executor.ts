import { cloneWorld, type Action, type World } from '../game/world.js';
import type { Player } from '../game/player.js';
import { makeApi } from './commands.js';
export interface RunResult { actions: Action[]; error?: string; line?: number; }
// V8 reports the failing line as <anonymous>:N where N counts lines of the
// synthesized function source (signature + preamble + user code). Instead of
// hardcoding that layout, calibrate once: a probe thrown on user line 1
// tells us the engine's offset, so userLine = N - offset on any engine.
function probeOffset(): number | undefined {
  try {
    new Function('"use strict";\nthrow new Error("probe")')();
  } catch (e) {
    const m = /<anonymous>:(\d+)/.exec((e as Error)?.stack ?? "");
    if (m) return parseInt(m[1], 10) - 1;
  }
  return undefined;
}
const LINE_OFFSET = probeOffset();
export function stripTypes(code: string): string {
  return code.replace(/:\s*(number|string|boolean|void|any)\b/g, '');
}
// NOTE: bare `energy` in user code is the value at RUN time (a snapshot).
// Live energy during the program is available as sense().energy, which reads
// the shadow simulation. Full statement-level interleaving is a LATER goal.
export function runCode(code: string, world: World, p: Player): RunResult {
  const q: Action[] = [];
  const clean = stripTypes(code);
  try {
    const simWorld = cloneWorld(world);
    const simP: Player = { ...p, state: 'idle' };
    const api = makeApi(q, simWorld, simP);
    const fn = new Function('moveUp', 'moveDown', 'moveLeft', 'moveRight', 'collect', 'sense', 'energy',
      '"use strict";\n' + clean);
    fn(api.moveUp, api.moveDown, api.moveLeft, api.moveRight, api.collect, api.sense, p.energy);
  } catch (e: unknown) {
    // stripTypes() only replaces within a line, never adds/removes newlines,
    // so the calibrated offset maps back to the user's line.
    const err = e instanceof Error ? e : new Error(String(e));
    const m = /<anonymous>:(\d+)/.exec(err.stack ?? "");
    const line =
      m && LINE_OFFSET !== undefined
        ? Math.max(1, parseInt(m[1], 10) - LINE_OFFSET)
        : undefined;
    return { actions: q, error: err.message, line };
  }
  if (q.length > 1000) return { actions: q.slice(0, 1000), error: 'step limit 1000 exceeded' };
  return { actions: q };
}

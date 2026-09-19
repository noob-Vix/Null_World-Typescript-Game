import { cloneWorld } from "../world/clone.js";
import type { Player } from "../player/types.js";
import type { World } from "../world/types.js";
import type { Action, RunResult } from "./types.js";
import { makeApi } from "./commands.js";
import { stripTypes } from "./strip-types.js";
// V8 reports the failing line as <anonymous>:N where N counts lines of the
// synthesized function source (signature + preamble + user code). Instead of
// hardcoding that layout, calibrate once: a probe thrown on user line 1
// tells us the engine's offset, so userLine = N - offset on any engine.
function probeOffset(): number | undefined {
  try {
    new Function('"use strict";\nthrow new Error("probe")')();
  } catch (thrown) {
    const match = /<anonymous>:(\d+)/.exec((thrown as Error)?.stack ?? "");
    if (match) return parseInt(match[1], 10) - 1;
  }
  return undefined;
}
const LINE_OFFSET = probeOffset();
// NOTE: bare `energy` in user code is the value at RUN time (a snapshot).
// Live energy during the program is available as sense().energy, which reads
// the shadow simulation. Full statement-level interleaving is a LATER goal.
export function runCode(
  code: string,
  world: World,
  player: Player,
): RunResult {
  const queue: Action[] = [];
  const clean = stripTypes(code);
  try {
    const simWorld = cloneWorld(world);
    const simPlayer: Player = { ...player, state: "idle" };
    const api = makeApi(queue, simWorld, simPlayer);
    const runUserCode = new Function(
      "moveUp",
      "moveDown",
      "moveLeft",
      "moveRight",
      "collect",
      "sense",
      "energy",
      '"use strict";\n' + clean,
    );
    runUserCode(
      api.moveUp,
      api.moveDown,
      api.moveLeft,
      api.moveRight,
      api.collect,
      api.sense,
      player.energy,
    );
  } catch (thrown: unknown) {
    // stripTypes() only replaces within a line, never adds/removes newlines,
    // so the calibrated offset maps back to the user's line.
    const error = thrown instanceof Error ? thrown : new Error(String(thrown));
    const match = /<anonymous>:(\d+)/.exec(error.stack ?? "");
    const line =
      match && LINE_OFFSET !== undefined
        ? Math.max(1, parseInt(match[1], 10) - LINE_OFFSET)
        : undefined;
    return { actions: queue, error: error.message, line };
  }
  if (queue.length > 1000)
    return { actions: queue.slice(0, 1000), error: "step limit 1000 exceeded" };
  return { actions: queue };
}

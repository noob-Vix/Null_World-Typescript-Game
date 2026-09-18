import { parseGrid, step, draw, type Action } from "./game/world.js";
import { mkPlayer } from "./game/player.js";
import { MISSIONS, UNLOCK_AFTER } from "./game/mission.js";
import { runCode } from "./scripting/executor.js";
import { validate } from "./scripting/validator.js";
import { bindEditor } from "./ui/editor.js";
import { renderObjective } from "./ui/objective.js";
import { loadSave, saveDone, renderTabs } from "./ui/hud.js";

export function boot() {
  const cv = document.getElementById("world") as HTMLCanvasElement;
  const ctx = cv.getContext("2d")!;
  const ta = document.getElementById("editor") as HTMLTextAreaElement;
  const pre = document.getElementById("lines") as HTMLElement;
  const hl = document.getElementById("hl") as HTMLElement;
  const con = document.getElementById("console") as HTMLElement;
  const obj = document.getElementById("objective") as HTMLElement;
  const tabs = document.getElementById("missionTabs") as HTMLElement;
  const win = document.getElementById("win") as HTMLElement;
  const title = document.getElementById("missionTitle") as HTMLElement;
  const unlockEl = document.getElementById("unlock") as HTMLElement;
  const ed = bindEditor(ta, pre, hl, con);
  let cur = MISSIONS[0];
  let worldState = parseGrid(cur.grid);
  let p = mkPlayer(worldState.start.x, worldState.start.y, cur.energy);
  let playing = false;
  let q: Action[] = [];
  let qi = 0;
  let last = 0;
  let acc = 0;
  const speed = document.getElementById("speed") as HTMLInputElement;
  const energyEl = document.getElementById("energy") as HTMLElement;
  const showEnergy = () => {
    energyEl.textContent = `⚡${p.energy}`;
  };

  function load(id: string) {
    cur = MISSIONS.find((m) => m.id === id)!;
    worldState = parseGrid(cur.grid);
    p = mkPlayer(worldState.start.x, worldState.start.y, cur.energy);
    ta.value = cur.starter;
    ta.dispatchEvent(new Event("input"));
    ed.clear();
    ed.log("> " + cur.title + ": " + cur.briefing);
    title.textContent = cur.id + " — " + cur.title;
    const done = loadSave().completed;
    unlockEl.textContent =
      (cur.unlock ?? UNLOCK_AFTER[cur.id])
        ? `🔓 ${cur.unlock ?? UNLOCK_AFTER[cur.id]}`
        : "";
    renderObjective(obj, cur, done);
    renderTabs(tabs, cur.id, done, (nid) => load(nid));
    win.classList.add("hidden");
    playing = false;
    q = [];
    qi = 0;
    showEnergy();
  }
  (document.getElementById("btnRun") as HTMLButtonElement).onclick = () => {
    // Fresh state every RUN: a retry must behave exactly like the first
    // attempt, otherwise the robot starts mid-level and correct code fails.
    const code = ta.value;
    load(cur.id);
    ta.value = code;
    ta.dispatchEvent(new Event("input"));
    ed.clear();
    acc = 0;
    const v = validate(ta.value, cur);
    if (!v.ok) {
      ed.log("ERR: " + v.error);
      return;
    }
    const r = runCode(ta.value, worldState.world, p);
    if (r.error) {
      ed.log("ERR: " + r.error + (r.line ? ` (line ${r.line})` : ""));
      ed.setError(r.line);
    }
    q = r.actions;
    qi = 0;
    playing = true;
    ed.log(`> running ${q.length} steps…`);
  };
  (document.getElementById("btnStop") as HTMLButtonElement).onclick = () => {
    playing = false;
    ed.log("■ stopped");
  };
  (document.getElementById("btnReset") as HTMLButtonElement).onclick = () =>
    load(cur.id);
  
  function checkWin(): boolean {
    const onTile = worldState.world.tiles[p.y]?.[p.x];
    if (cur.need.reachTerminal) return onTile === 3 || p.collected > 0;
    if (cur.need.collect) return p.collected >= (cur.need.collect || 0);
    return onTile === 2 || onTile === 3 || p.collected > 0;
  }
  function frame(t: number) {
    const dt = t - last;
    last = t;
    if (playing) {
      acc += dt * parseFloat(speed.value);
      const interval = 150;
      while (acc >= interval && qi < q.length) {
        acc -= interval;
        const a = q[qi++];
        const msg = step(worldState.world, p, a);
        if (msg.startsWith("hazard") || msg.startsWith("energy")) {
          ed.log("ERR: " + msg);
          playing = false;
          p.state = "error";
          break;
        }
        if (msg.startsWith("bump") || msg.startsWith("collect:")) {
          ed.log("! " + msg);
        }
      }
      if (qi >= q.length && playing) {
        playing = false;
        if (checkWin()) {
          p.state = "success";
          saveDone(cur.id);
          const un = cur.unlock ?? UNLOCK_AFTER[cur.id];
          win.classList.remove("hidden");
          win.innerHTML = `<div style="background:#0d1330;padding:24px;border-radius:12px;text-align:center"><h2>SUCCESS ✓</h2><p>${cur.title} complete</p>${un ? `<p>🔓 Unlocked: ${un}</p>` : ""}<button id="wNext">NEXT →</button> <button id="wRe">REPLAY</button></div>`;
          (document.getElementById("wNext") as HTMLButtonElement).onclick =
            () => {
              const i = MISSIONS.findIndex((m) => m.id === cur.id);
              load(MISSIONS[Math.min(i + 1, MISSIONS.length - 1)].id);
            };
          (document.getElementById("wRe") as HTMLButtonElement).onclick = () =>
            load(cur.id);
        } else {
          ed.log(
            `✗ not yet: collected ${p.collected}, at (${p.x},${p.y}). Check objective + RESET and retry.`,
          );
          p.state = "error";
        }
      }
    }
    if (!playing && p.state === "walk") p.state = "idle";
    showEnergy();
    draw(ctx, worldState.world, p, t);
    requestAnimationFrame(frame);
  }
  load("01");
  requestAnimationFrame(frame);
}
boot();

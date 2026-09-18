import { parseGrid } from "./world/parse.js";
import { loadSave, nextMission, saveDone, unlockFor } from "./manager/progression.js";
import { render } from "./world/render.js";
import { step } from "./world/step.js";
import { Tile } from "./world/tile.js";
import { mkPlayer } from "./player/player.js";
import { MISSIONS } from "./manager/missions.js";
import type { Action } from "./commands/types.js";
import { runCode } from "./commands/executor.js";
import { validate } from "./commands/validator.js";
import { bindEditor } from "./ui/editor.js";
import { renderObjective } from "./ui/objective.js";
import {
  hideWin,
  renderEnergy,
  renderTabs,
  showWin,
} from "./ui/hud.js";

export function boot() {
  const canvas = document.getElementById("world") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;
  const codeInput = document.getElementById("editor") as HTMLTextAreaElement;
  const lineNumbers = document.getElementById("lines") as HTMLElement;
  const highlightLayer = document.getElementById("hl") as HTMLElement;
  const consolePane = document.getElementById("console") as HTMLElement;
  const objectivePane = document.getElementById("objective") as HTMLElement;
  const missionTabs = document.getElementById("missionTabs") as HTMLElement;
  const winOverlay = document.getElementById("win") as HTMLElement;
  const titleLabel = document.getElementById("missionTitle") as HTMLElement;
  const unlockBadge = document.getElementById("unlock") as HTMLElement;
  const speedSlider = document.getElementById("speed") as HTMLInputElement;
  const energyBadge = document.getElementById("energy") as HTMLElement;
  const editor = bindEditor(codeInput, lineNumbers, highlightLayer, consolePane);
  let currentMission = MISSIONS[0];
  let worldState = parseGrid(currentMission.grid);
  let player = mkPlayer(
    worldState.start.x,
    worldState.start.y,
    currentMission.energy,
  );
  let playing = false;
  let queue: Action[] = [];
  let queueIndex = 0;
  let lastFrameTime = 0;
  let accumulatedMs = 0;

  function load(id: string) {
    currentMission = MISSIONS.find((mission) => mission.id === id)!;
    worldState = parseGrid(currentMission.grid);
    player = mkPlayer(
      worldState.start.x,
      worldState.start.y,
      currentMission.energy,
    );
    codeInput.value = currentMission.starter;
    codeInput.dispatchEvent(new Event("input"));
    editor.clear();
    editor.log("> " + currentMission.title + ": " + currentMission.briefing);
    titleLabel.textContent = currentMission.id + " — " + currentMission.title;
    const completedIds = loadSave().completed;
    const unlockName = unlockFor(currentMission);
    unlockBadge.textContent = unlockName ? `🔓 ${unlockName}` : "";
    renderObjective(objectivePane, currentMission, completedIds);
    renderTabs(missionTabs, currentMission.id, completedIds, (nextId) =>
      load(nextId),
    );
    hideWin(winOverlay);
    playing = false;
    queue = [];
    queueIndex = 0;
    renderEnergy(energyBadge, player.energy);
  }
  (document.getElementById("btnRun") as HTMLButtonElement).onclick = () => {
    // Fresh state every RUN: a retry must behave exactly like the first
    // attempt, otherwise the robot starts mid-level and correct code fails.
    const code = codeInput.value;
    load(currentMission.id);
    codeInput.value = code;
    codeInput.dispatchEvent(new Event("input"));
    editor.clear();
    accumulatedMs = 0;
    const validation = validate(codeInput.value, currentMission);
    if (!validation.ok) {
      editor.log("ERR: " + validation.error);
      return;
    }
    const result = runCode(codeInput.value, worldState.world, player);
    if (result.error) {
      editor.log(
        "ERR: " + result.error + (result.line ? ` (line ${result.line})` : ""),
      );
      editor.setError(result.line);
    }
    queue = result.actions;
    queueIndex = 0;
    playing = true;
    editor.log(`> running ${queue.length} steps…`);
  };
  (document.getElementById("btnStop") as HTMLButtonElement).onclick = () => {
    playing = false;
    editor.log("■ stopped");
  };
  (document.getElementById("btnReset") as HTMLButtonElement).onclick = () =>
    load(currentMission.id);

  function checkWin(): boolean {
    const standingOn = worldState.world.tiles[player.y]?.[player.x];
    if (currentMission.need.reachTerminal)
      return standingOn === Tile.Terminal || player.collected > 0;
    if (currentMission.need.collect)
      return player.collected >= (currentMission.need.collect || 0);
    return (
      standingOn === Tile.Crystal ||
      standingOn === Tile.Terminal ||
      player.collected > 0
    );
  }
  function frame(timestamp: number) {
    const deltaMs = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    if (playing) {
      accumulatedMs += deltaMs * parseFloat(speedSlider.value);
      const interval = 150;
      while (accumulatedMs >= interval && queueIndex < queue.length) {
        accumulatedMs -= interval;
        const action = queue[queueIndex++];
        const stepResult = step(worldState.world, player, action);
        if (stepResult.startsWith("hazard") || stepResult.startsWith("energy")) {
          editor.log("ERR: " + stepResult);
          playing = false;
          player.state = "error";
          break;
        }
        if (stepResult.startsWith("bump") || stepResult.startsWith("collect:")) {
          editor.log("! " + stepResult);
        }
      }
      if (queueIndex >= queue.length && playing) {
        playing = false;
        if (checkWin()) {
          player.state = "success";
          saveDone(currentMission.id);
          showWin(
            winOverlay,
            currentMission.title,
            unlockFor(currentMission),
            () => load(nextMission(currentMission).id),
            () => load(currentMission.id),
          );
        } else {
          editor.log(
            `✗ not yet: collected ${player.collected}, at (${player.x},${player.y}). Check objective + RESET and retry.`,
          );
          player.state = "error";
        }
      }
    }
    if (!playing && player.state === "walk") player.state = "idle";
    renderEnergy(energyBadge, player.energy);
    render(ctx, worldState.world, player, timestamp);
    requestAnimationFrame(frame);
  }
  load("01");
  requestAnimationFrame(frame);
}
boot();

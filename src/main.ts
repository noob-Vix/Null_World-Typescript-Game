import { parseGrid } from "./world/parse.js";
import { loadSave, nextMission, saveDone, saveTerminalDone, unlockFor } from "./manager/progression.js";
import { render } from "./world/render.js";
import { endsRun, step } from "./world/step.js";
import { Tile } from "./world/tile.js";
import { mkPlayer } from "./player/player.js";
import { MISSIONS } from "./manager/missions.js";
import { TERMINALS } from "./manager/terminals.js";
import type { TerminalMission } from "./manager/types.js";
import type { Action } from "./commands/types.js";
import { runCode } from "./commands/executor.js";
import { runTerminalTests, type TerminalRun } from "./commands/test-runner.js";
import { validate } from "./commands/validator.js";
import { bindEditor } from "./ui/editor.js";
import { renderObjective } from "./ui/objective.js";
import {
  hideWin,
  renderEnergy,
  renderTabs,
  renderTerminalTabs,
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
  const terminalTabs = document.getElementById("terminalTabs") as HTMLElement;
  const winOverlay = document.getElementById("win") as HTMLElement;
  const titleLabel = document.getElementById("missionTitle") as HTMLElement;
  const unlockBadge = document.getElementById("unlock") as HTMLElement;
  const speedSlider = document.getElementById("speed") as HTMLInputElement;
  const energyBadge = document.getElementById("energy") as HTMLElement;
  const pauseButton = document.getElementById("btnPause") as HTMLButtonElement;
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
  let mode: "field" | "terminal" = "field";
  let currentTerminal = TERMINALS[0];
  let terminalRun: TerminalRun | null = null;

  function refreshTabs() {
    const save = loadSave();
    renderTabs(missionTabs, currentMission.id, save.completed, (nextId) =>
      load(nextId),
    );
    renderTerminalTabs(
      terminalTabs,
      currentTerminal.id,
      save.terminals,
      (nextId) => loadTerminal(nextId),
    );
  }

  function load(id: string) {
    mode = "field";
    terminalRun?.cancel();
    terminalRun = null;
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
    refreshTabs();
    hideWin(winOverlay);
    playing = false;
    queue = [];
    queueIndex = 0;
    pauseButton.textContent = "⏸ Pause";
    renderEnergy(energyBadge, player.energy);
  }
  function loadTerminal(id: string) {
    mode = "terminal";
    terminalRun?.cancel();
    terminalRun = null;
    currentTerminal = TERMINALS.find((terminal) => terminal.id === id)!;
    codeInput.value = currentTerminal.stub;
    codeInput.dispatchEvent(new Event("input"));
    editor.clear();
    editor.log(
      "> " + currentTerminal.title + ": " + currentTerminal.briefing,
    );
    titleLabel.textContent =
      currentTerminal.id + " — " + currentTerminal.title;
    unlockBadge.textContent = "";
    const save = loadSave();
    renderObjective(objectivePane, currentTerminal, save.terminals);
    refreshTabs();
    hideWin(winOverlay);
    playing = false;
  }
  (document.getElementById("btnRun") as HTMLButtonElement).onclick = async () => {
    if (mode === "terminal") {
      await runTerminalMission();
      return;
    }
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
  pauseButton.onclick = () => {
    if (playing) {
      playing = false;
      pauseButton.textContent = "▶ Resume";
      editor.log("⏸ paused — press play to resume.");
    } else if (queueIndex < queue.length) {
      playing = true;
      pauseButton.textContent = "⏸ Pause";
      editor.log("▶ resumed.");
    }
  };
  async function runTerminalMission() {
    terminalRun?.cancel();
    editor.clear();
    editor.log(`> testing ${currentTerminal.functionName}…`);
    const run = runTerminalTests(codeInput.value, currentTerminal);
    terminalRun = run;
    const answer = await run.done;
    if (terminalRun !== run) return;
    terminalRun = null;
    if (answer.fatal) {
      editor.log("ERR: " + answer.fatal);
      return;
    }
    const allTests = [
      ...currentTerminal.visibleTests,
      ...currentTerminal.hiddenTests,
    ];
    let passedCount = 0;
    answer.results.forEach((result) => {
      const testCase = allTests[result.index];
      const label =
        result.index < currentTerminal.visibleTests.length
          ? `case ${result.index + 1}`
          : `hidden ${result.index + 1 - currentTerminal.visibleTests.length}`;
      if (result.passed) {
        passedCount++;
        editor.log(`✓ ${label}`);
      } else if (result.error) {
        editor.log(`✗ ${label}: ${result.error}`);
      } else {
        editor.log(
          `✗ ${label}: expected ${JSON.stringify(testCase.expected)} got ${JSON.stringify(result.got)}`,
        );
      }
    });
    if (passedCount === allTests.length) {
      editor.log(`✓ ACCEPTED — ${currentTerminal.powersText}`);
      saveTerminalDone(currentTerminal.id);
      const index = TERMINALS.findIndex(
        (terminal) => terminal.id === currentTerminal.id,
      );
      const next =
        TERMINALS[Math.min(index + 1, TERMINALS.length - 1)];
      showWin(
        winOverlay,
        currentTerminal.title,
        currentTerminal.powersText,
        () => loadTerminal(next.id),
        () => loadTerminal(currentTerminal.id),
      );
    } else {
      editor.log(
        `✗ ${passedCount}/${allTests.length} passed — fix it and run again.`,
      );
    }
    refreshTabs();
  }
  (document.getElementById("btnReset") as HTMLButtonElement).onclick = () => {
    if (mode === "terminal") loadTerminal(currentTerminal.id);
    else load(currentMission.id);
  };

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
        if (endsRun(stepResult)) {
          editor.log("ERR: " + stepResult);
          playing = false;
          player.state = "error";
          pauseButton.textContent = "⏸ Pause";
          break;
        }
        if (stepResult.startsWith("collect:")) {
          editor.log("! " + stepResult);
        }
      }
      if (queueIndex >= queue.length && playing) {
        playing = false;
        pauseButton.textContent = "⏸ Pause";
        if (queue.length === 0) {
          player.state = "idle";
          editor.log("○ drone is idle — no orders. Write code and press play.");
        } else if (checkWin()) {
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
    render(ctx, worldState.world, player, timestamp, currentMission.viewRadius);
    requestAnimationFrame(frame);
  }
  load("01");
  requestAnimationFrame(frame);
}
boot();

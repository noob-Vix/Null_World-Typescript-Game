import { MISSIONS } from "../manager/missions.js";
import { TERMINALS } from "../manager/terminals.js";
export function renderTabs(
  element: HTMLElement,
  currentId: string,
  completedIds: string[],
  onSelect: (id: string) => void,
) {
  void currentId;
  element.innerHTML = "";
  MISSIONS.forEach((mission, index) => {
    const locked = index > 0 && !completedIds.includes(MISSIONS[index - 1].id);
    const button = document.createElement("button");
    button.textContent = `${mission.id}${completedIds.includes(mission.id) ? " ✓" : ""}`;
    button.disabled = locked;
    button.title = mission.title;
    button.onclick = () => onSelect(mission.id);
    element.appendChild(button);
  });
}
export function renderEnergy(element: HTMLElement, energyValue: number) {
  element.textContent = `⚡${energyValue}`;
}
export function showWin(
  element: HTMLElement,
  missionTitle: string,
  unlockedConcept: string | undefined,
  onNext: () => void,
  onReplay: () => void,
) {
  element.classList.remove("hidden");
  element.innerHTML = `<div style="background:#0d1330;padding:24px;border-radius:12px;text-align:center"><h2>SUCCESS ✓</h2><p>${missionTitle} complete</p>${unlockedConcept ? `<p>🔓 Unlocked: ${unlockedConcept}</p>` : ""}<button id="wNext">NEXT →</button> <button id="wRe">REPLAY</button></div>`;
  (document.getElementById("wNext") as HTMLButtonElement).onclick = onNext;
  (document.getElementById("wRe") as HTMLButtonElement).onclick = onReplay;
}
export function hideWin(element: HTMLElement) {
  element.classList.add("hidden");
}
export function renderTerminalTabs(
  element: HTMLElement,
  currentId: string,
  completedIds: string[],
  onSelect: (id: string) => void,
) {
  void currentId;
  element.innerHTML = "";
  TERMINALS.forEach((terminal) => {
    const button = document.createElement("button");
    button.textContent = `${terminal.id}${completedIds.includes(terminal.id) ? " ✓" : ""}`;
    button.title = `${terminal.title} (${terminal.difficulty})`;
    button.onclick = () => onSelect(terminal.id);
    element.appendChild(button);
  });
}

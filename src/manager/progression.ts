import { MISSIONS } from "./missions.js";
import type { Mission } from "./types.js";
export const UNLOCK_AFTER: Record<string, string> = {
  "04": "Variables",
  "06": "Conditions",
  "07": "Loops",
  "08": "Functions",
  "09": "Arrays",
};
export function unlockFor(mission: Mission): string | undefined {
  return mission.unlock ?? UNLOCK_AFTER[mission.id];
}
const KEY = "nullworld-save";
export function loadSave(): { completed: string[] } {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{"completed":[]}');
  } catch {
    return { completed: [] };
  }
}
export function saveDone(id: string) {
  const save = loadSave();
  if (!save.completed.includes(id)) {
    save.completed.push(id);
    localStorage.setItem(KEY, JSON.stringify(save));
  }
}
export function nextMission(mission: Mission): Mission {
  const index = MISSIONS.findIndex((entry) => entry.id === mission.id);
  return MISSIONS[Math.min(index + 1, MISSIONS.length - 1)];
}

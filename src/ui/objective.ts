import type { Mission } from "../manager/types.js";
export function renderObjective(
  element: HTMLElement,
  mission: Mission,
  unlocked: string[],
) {
  element.innerHTML = `<b>${mission.id} — ${mission.title}</b><br/>${mission.briefing}<br/><i>Hint: ${mission.hint}</i><br/>Unlocked: ${unlocked.join(", ") || "commands"}`;
}

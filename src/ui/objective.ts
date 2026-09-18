import type { Mission } from "../game/mission.js";
export function renderObjective(
  el: HTMLElement,
  m: Mission,
  unlocked: string[],
) {
  el.innerHTML = `<b>${m.id} — ${m.title}</b><br/>${m.briefing}<br/><i>Hint: ${m.hint}</i><br/>Unlocked: ${unlocked.join(", ") || "commands"}`;
}

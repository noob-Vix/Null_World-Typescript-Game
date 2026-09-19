export interface ObjectiveInfo {
  id: string;
  title: string;
  briefing: string;
  difficulty: string;
  tags: string[];
  hint: string;
}
export function renderObjective(
  element: HTMLElement,
  info: ObjectiveInfo,
  unlocked: string[],
) {
  element.innerHTML = `<b>${info.id} — ${info.title}</b> <span class="diff-${info.difficulty}">${info.difficulty}</span><br/>${info.briefing}<br/><i>Hint: ${info.hint}</i><br/>Tags: ${info.tags.join(", ")}<br/>Unlocked: ${unlocked.join(", ") || "commands"}`;
}

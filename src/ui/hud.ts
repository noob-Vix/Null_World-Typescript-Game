import { MISSIONS } from "../game/mission.js";
const KEY = "nullworld-save";
export function loadSave(): { completed: string[] } {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{"completed":[]}');
  } catch {
    return { completed: [] };
  }
}
export function saveDone(id: string) {
  const s = loadSave();
  if (!s.completed.includes(id)) {
    s.completed.push(id);
    localStorage.setItem(KEY, JSON.stringify(s));
  }
}
export function renderTabs(
  el: HTMLElement,
  cur: string,
  done: string[],
  go: (id: string) => void,
) {
  void cur;
  el.innerHTML = "";
  MISSIONS.forEach((m, i) => {
    const locked = i > 0 && !done.includes(MISSIONS[i - 1].id);
    const b = document.createElement("button");
    b.textContent = `${m.id}${done.includes(m.id) ? " ✓" : ""}`;
    b.disabled = locked;
    b.title = m.title;
    b.onclick = () => go(m.id);
    el.appendChild(b);
  });
}

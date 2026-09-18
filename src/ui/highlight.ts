export function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// Single left-to-right pass: at each position the earliest-starting
// alternative wins, so a // inside a string is consumed by the string match
// (its opening quote comes first) and never treated as a comment.
const TOKEN_PATTERN =
  /('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|(\/\/[^\n]*)|\b(let|const|function|if|else|for|while|return)\b|\b(moveUp|moveDown|moveLeft|moveRight|collect|sense)\b|\b(energy)\b|\b(\d+)\b/g;
export function highlight(code: string): string {
  return esc(code).replace(
    TOKEN_PATTERN,
    (
      match: string,
      quoted?: string,
      comment?: string,
      keyword?: string,
      command?: string,
      energyRef?: string,
      digits?: string,
    ) => {
      if (quoted) return `<span class="tk-s">${quoted}</span>`;
      if (comment) return `<span class="tk-c">${comment}</span>`;
      if (keyword) return `<span class="tk-k">${keyword}</span>`;
      if (command) return `<span class="tk-f">${command}</span>`;
      if (energyRef) return `<span class="tk-e">${energyRef}</span>`;
      if (digits) return `<span class="tk-n">${digits}</span>`;
      return match;
    },
  );
}
const COMPLETIONS = [
  "moveUp()",
  "moveDown()",
  "moveLeft()",
  "moveRight()",
  "collect()",
  "sense()",
  "energy",
  "if",
  "for",
  "let",
  "function",
];
// Pure + testable: given the word fragment before the caret, return the text
// to insert (suffix of the unique match, or the common prefix), or null.
export function completeWord(fragment: string): string | null {
  if (!fragment) return null;
  const candidates = COMPLETIONS.filter(
    (candidate) => candidate.startsWith(fragment) && candidate !== fragment,
  );
  if (!candidates.length) return null;
  let common = candidates[0];
  for (const candidate of candidates) {
    let index = 0;
    while (
      index < common.length &&
      index < candidate.length &&
      common[index] === candidate[index]
    )
      index++;
    common = common.slice(0, index);
  }
  if (common.length <= fragment.length) return null;
  return common.slice(fragment.length);
}

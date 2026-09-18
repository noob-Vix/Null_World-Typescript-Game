export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// Single left-to-right pass: at each position the earliest-starting
// alternative wins, so a // inside a string is consumed by the string match
// (its opening quote comes first) and never treated as a comment.
const TOK =
  /('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|(\/\/[^\n]*)|\b(let|const|function|if|else|for|while|return)\b|\b(moveUp|moveDown|moveLeft|moveRight|collect|sense)\b|\b(energy)\b|\b(\d+)\b/g;
export function highlight(code: string): string {
  return esc(code).replace(
    TOK,
    (
      m: string,
      str?: string,
      com?: string,
      kw?: string,
      cmd?: string,
      en?: string,
      num?: string,
    ) => {
      if (str) return `<span class="tk-s">${str}</span>`;
      if (com) return `<span class="tk-c">${com}</span>`;
      if (kw) return `<span class="tk-k">${kw}</span>`;
      if (cmd) return `<span class="tk-f">${cmd}</span>`;
      if (en) return `<span class="tk-e">${en}</span>`;
      if (num) return `<span class="tk-n">${num}</span>`;
      return m;
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
export function completeWord(frag: string): string | null {
  if (!frag) return null;
  const cands = COMPLETIONS.filter((c) => c.startsWith(frag) && c !== frag);
  if (!cands.length) return null;
  let common = cands[0];
  for (const c of cands) {
    let i = 0;
    while (i < common.length && i < c.length && common[i] === c[i]) i++;
    common = common.slice(0, i);
  }
  if (common.length <= frag.length) return null;
  return common.slice(frag.length);
}
export function bindEditor(
  ta: HTMLTextAreaElement,
  pre: HTMLElement,
  hl: HTMLElement,
  con: HTMLElement,
) {
  let errLine: number | undefined;
  const upd = () => {
    const lines = ta.value.split("\n");
    pre.innerHTML = lines
      .map((_, i) =>
        i + 1 === errLine
          ? `<span class="errLine">${String(i + 1).padStart(2, " ")}</span>`
          : String(i + 1).padStart(2, " "),
      )
      .join("\n");
    hl.innerHTML = highlight(ta.value) + "\n";
  };
  ta.addEventListener("input", () => {
    errLine = undefined;
    upd();
  });
  ta.addEventListener("scroll", () => {
    hl.scrollTop = ta.scrollTop;
    hl.scrollLeft = ta.scrollLeft;
    pre.scrollTop = ta.scrollTop;
  });
  ta.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const pos = ta.selectionStart ?? 0;
    const m = /[A-Za-z_][A-Za-z0-9_]*$/.exec(ta.value.slice(0, pos));
    if (!m) return;
    const ins = completeWord(m[0]);
    if (!ins) return;
    ta.setRangeText(ins, pos - m[0].length, pos, "end");
    ta.dispatchEvent(new Event("input"));
  });
  upd();
  return {
    log: (s: string) => {
      con.textContent += s + "\n";
    },
    clear: () => {
      con.textContent = "";
    },
    setError: (line?: number) => {
      errLine = line;
      upd();
    },
  };
}

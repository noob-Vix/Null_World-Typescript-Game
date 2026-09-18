import { completeWord, highlight } from "./highlight.js";
export function bindEditor(
  codeInput: HTMLTextAreaElement,
  lineNumbers: HTMLElement,
  highlightLayer: HTMLElement,
  consolePane: HTMLElement,
) {
  let errorLine: number | undefined;
  const refresh = () => {
    const lines = codeInput.value.split("\n");
    lineNumbers.innerHTML = lines
      .map((_, index) =>
        index + 1 === errorLine
          ? `<span class="errLine">${String(index + 1).padStart(2, " ")}</span>`
          : String(index + 1).padStart(2, " "),
      )
      .join("\n");
    highlightLayer.innerHTML = highlight(codeInput.value) + "\n";
  };
  codeInput.addEventListener("input", () => {
    errorLine = undefined;
    refresh();
  });
  codeInput.addEventListener("scroll", () => {
    highlightLayer.scrollTop = codeInput.scrollTop;
    highlightLayer.scrollLeft = codeInput.scrollLeft;
    lineNumbers.scrollTop = codeInput.scrollTop;
  });
  codeInput.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const cursor = codeInput.selectionStart ?? 0;
    const wordMatch = /[A-Za-z_][A-Za-z0-9_]*$/.exec(
      codeInput.value.slice(0, cursor),
    );
    if (!wordMatch) return;
    const insertion = completeWord(wordMatch[0]);
    if (!insertion) return;
    codeInput.setRangeText(
      insertion,
      cursor - wordMatch[0].length,
      cursor,
      "end",
    );
    codeInput.dispatchEvent(new Event("input"));
  });
  refresh();
  return {
    log: (message: string) => {
      consolePane.textContent += message + "\n";
    },
    clear: () => {
      consolePane.textContent = "";
    },
    setError: (line?: number) => {
      errorLine = line;
      refresh();
    },
  };
}

// Removes simple TypeScript type annotations so player code runs as plain
// JavaScript. Handles bare types (: number) and array suffixes (: number[]).
// Only replaces within a line: newlines are never added or removed, so error
// line numbers still map back to the user's code.
export function stripTypes(code: string): string {
  return code.replace(/:\s*(number|string|boolean|void|any)(\[\])?/g, "");
}

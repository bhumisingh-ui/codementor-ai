export function extractSnippets(code, findings = []) {
  const lines = String(code || "").split(/\r?\n/);
  const snippets = [];

  for (const finding of findings) {
    const line = Number(finding?.line) || 0;
    if (line <= 0) {
      continue;
    }

    const start = Math.max(1, line - 3);
    const end = Math.min(lines.length, line + 3);

    snippets.push({
      line,
      snippet: lines.slice(start - 1, end).join("\n"),
    });
  }

  return snippets;
}
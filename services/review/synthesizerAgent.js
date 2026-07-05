import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function safeParseAI(raw) {
  if (typeof raw !== "string") return {};

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return {};

  try {
    return JSON.parse(match[0]);
  } catch {
    try {
      return JSON.parse(match[0].replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
    } catch {
      return {};
    }
  }
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeFinding(finding, fallback = {}) {
  const line = Number(finding?.line ?? fallback.line) || 0;
  const type = String(finding?.type || fallback.type || "").trim();
  const message = String(finding?.message || finding?.msg || "").trim();
  const suggestion = String(finding?.suggestion || finding?.fix || fallback.suggestion || "").trim();

  if (!type || !message) {
    return null;
  }

  return {
    line,
    type,
    message,
    suggestion,
    msg: message,
    fix: suggestion,
    severity: finding?.severity ?? fallback.severity,
    rule: finding?.rule ?? fallback.rule,
    source: finding?.source ?? fallback.source,
  };
}

function dedupeFindings(findings) {
  const seen = new Set();
  const merged = [];

  for (const finding of findings) {
    const key = `${finding.line}|${finding.type}|${finding.message}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(finding);
  }

  return merged;
}

export async function synthesizerAgent({ code, language, bugFindings = [], securityFindings = [], performanceFindings = [] }) {
  const prompt = [
    "Analyze the code using the provided bug and security findings.",
    'Return JSON {"score":number,"criticalIssues":[...],"warnings":[...],"suggestions":[...]}',
    "Keep the response compact and practical.",
    "Performance findings are reserved for a future pass.",
  ].join(" ");

  const contents = `${prompt}\n\nLanguage: ${language || "unknown"}\n\nCode:\n${code || ""}\n`;
  const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents });

  const aiResult = safeParseAI(response.text);
  aiResult.score = aiResult.score ?? 0;
  aiResult.criticalIssues = toArray(aiResult.criticalIssues)
    .map((issue) => normalizeFinding(issue, { type: "critical", source: "ai" }))
    .filter(Boolean);
  aiResult.warnings = toArray(aiResult.warnings)
    .map((issue) => normalizeFinding(issue, { type: "warning", source: "ai" }))
    .filter(Boolean);
  aiResult.suggestions = toArray(aiResult.suggestions)
    .map((issue) => normalizeFinding(issue, { type: "style", source: "ai" }))
    .filter(Boolean);

  const finalReview = [];

  for (const finding of bugFindings) {
    const normalized = normalizeFinding(finding, {
      type: "bug",
      source: "bug-agent",
    });

    if (normalized) {
      finalReview.push(normalized);
    }
  }

  for (const finding of securityFindings) {
    const normalized = normalizeFinding(
      {
        line: finding.line,
        type: "security",
        message: `${finding.rule}: ${finding.message}`,
        suggestion: `Severity: ${finding.severity}`,
        severity: finding.severity,
        rule: finding.rule,
        source: "semgrep",
      },
      { type: "security" }
    );

    if (normalized) {
      normalized.rule = finding.rule;
      normalized.severity = finding.severity;
      finalReview.push(normalized);
    }
  }

  for (const finding of performanceFindings) {
    const normalized = normalizeFinding(
      {
        line: finding.line || 0,
        type: "performance",
        message: finding.message || "Performance finding.",
        suggestion: finding.suggestion || "",
        severity: finding.severity || "medium",
        source: "performance-agent",
      },
      { type: "performance" }
    );

    if (normalized) {
      normalized.severity = finding.severity || "medium";
      finalReview.push(normalized);
    }
  }

  for (const issue of aiResult.criticalIssues) {
    const normalized = normalizeFinding(issue, { type: "critical", source: "ai" });
    if (normalized) {
      finalReview.push(normalized);
    }
  }

  for (const issue of aiResult.warnings) {
    const normalized = normalizeFinding(issue, { type: "warning", source: "ai" });
    if (normalized) {
      finalReview.push(normalized);
    }
  }

  for (const suggestion of aiResult.suggestions) {
    const normalized = normalizeFinding(suggestion, { type: "style", source: "ai" });
    if (normalized) {
      finalReview.push(normalized);
    }
  }

  const dedupedFinalReview = dedupeFindings(finalReview);

  return {
    bugFindings,
    securityFindings,
    performanceFindings,
    aiReview: aiResult,
    finalReview: dedupedFinalReview,
    score: aiResult.score,
    summary: "AI-based static analysis completed.",
    issues: dedupedFinalReview,
  };
}
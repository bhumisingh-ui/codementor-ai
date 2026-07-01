import { GoogleGenAI } from "@google/genai";
import { securityAgent } from "../agents/securityAgent.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function parseSemgrepOutput(raw) {
  try {
    const data = JSON.parse(raw || "{}");
    const results = Array.isArray(data.results) ? data.results : [];

    return results.map((item) => ({
      type: "security",
      line: item?.start?.line || 0,
      rule: item?.check_id || "unknown-rule",
      severity: item?.extra?.severity || "INFO",
      message: item?.extra?.message || "Security issue found",
    }));
  } catch {
    return [];
  }
}

export async function runRepoSummary(repoName, repoData) {
  // `repoData` contains joined results from the multi-agent pipeline.
  // The security agent runs on every file, while bug and performance are
  // placeholders for future implementation.
  const prompt = `You are a friendly AI mentor helping students improve repository quality.

Repository: ${repoName}
Files analyzed: ${repoData.filesAnalyzed}
Security findings: ${repoData.securityFindings.length}
Bug findings: ${repoData.bugFindings.length}
Performance findings: ${repoData.performanceFindings.length}

Summary by file:
${JSON.stringify(repoData.fileSummaries, null, 2)}

Analyze these agent outputs and return ONLY valid JSON with the following fields:
{
  "summary": string,
  "majorRisks": [{ "message": string }],
  "prioritizedIssues": [{ "message": string, "severity": string }],
  "actionableSuggestions": [{ "message": string }]
}

Merge overlapping issues, rank by severity, prioritize critical issues, and generate actionable suggestions.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const raw = response.text;
  const match = raw.match(/\{[\s\S]*\}/);
  return match
    ? JSON.parse(match[0])
    : {
        summary: "Could not generate repository summary.",
        majorRisks: [],
        prioritizedIssues: [],
        actionableSuggestions: [],
      };
}

export async function runCodeReview(code, language) {
  const securityFindings = await securityAgent(code, language);

  const prompt = `You are a friendly AI mentor helping students improve their code.

Guidelines:
- Be concise and beginner-friendly
- Explain issues in simple words
- Focus on learning and improvement
- Avoid harsh or judgmental language
- Prefer short, meaningful feedback

  Semgrep Findings:
  ${JSON.stringify(securityFindings, null, 2)}

Analyze the following ${language} code.
Return ONLY valid JSON in this format:
{
  "score": number,
  "criticalIssues": [{ "line": number, "message": string }],
  "warnings": [{ "line": number, "message": string }],
  "suggestions": [{ "message": string }]
}

Rules:
- Score should reflect overall code quality (0–100)
- Critical issues = bugs, crashes, infinite loops
- Warnings = performance or bad practices
- Suggestions = style or learning tips (short)

Code:
${code}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const raw = response.text;
  const match = raw.match(/\{[\s\S]*\}/);
  const geminiResult = match ? JSON.parse(match[0]) : { score: 0, criticalIssues: [], warnings: [], suggestions: [] };

  let id = 1;
  const finalReview = [];

  for (const finding of securityFindings) {
    finalReview.push({
      id: id++,
      type: "security",
      line: finding.line,
      msg: `${finding.rule}: ${finding.message}`,
      fix: `Severity: ${finding.severity}`,
      rule: finding.rule,
      severity: finding.severity,
      source: "semgrep",
    });
  }

  for (const i of geminiResult.criticalIssues || []) {
    finalReview.push({
      id: id++,
      type: "critical",
      line: i.line,
      msg: i.message,
      fix: "Add proper termination or refactor logic.",
      source: "ai",
    });
  }

  for (const i of geminiResult.warnings || []) {
    finalReview.push({
      id: id++,
      type: "warning",
      line: i.line,
      msg: i.message,
      fix: "Optimize or simplify this logic.",
      source: "ai",
    });
  }

  for (const i of geminiResult.suggestions || []) {
    finalReview.push({
      id: id++,
      type: "style",
      line: 0,
      msg: i.message,
      fix: "Apply best practice.",
      source: "ai",
    });
  }

  return {
    securityFindings,
    aiReview: geminiResult,
    finalReview,
    score: geminiResult.score ?? 0,
    summary: "AI-based static analysis completed.",
    issues: finalReview,
  };
}

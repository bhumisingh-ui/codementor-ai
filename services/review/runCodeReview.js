import { GoogleGenAI } from "@google/genai";
import { securityAgent } from "../agents/securityAgent.js";
import { bugAgent } from "../agents/bugAgent.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function safeParseAI(raw) {
  if (typeof raw !== "string") return {};
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return {};
  try {
    return JSON.parse(m[0]);
  } catch {
    try {
      return JSON.parse(m[0].replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
    } catch {
      return {};
    }
  }
}

export async function runCodeReview(code, language) {
  const securityFindings = await securityAgent(code, language);
  const bugFindings = await bugAgent(code, language);

  const prompt = `Analyze the code and semgrep findings. Return JSON {"score":number,"criticalIssues":[...],"warnings":[...],"suggestions":[...]}`;
  const resp = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt + "\n\nCode:\n" + code });

  const aiResult = safeParseAI(resp.text);
  aiResult.score = aiResult.score ?? 0;
  aiResult.criticalIssues = Array.isArray(aiResult.criticalIssues) ? aiResult.criticalIssues : [];
  aiResult.warnings = Array.isArray(aiResult.warnings) ? aiResult.warnings : [];
  aiResult.suggestions = Array.isArray(aiResult.suggestions) ? aiResult.suggestions : [];

  let id = 1;
  const finalReview = [];

  for (const f of bugFindings) {
    finalReview.push({ id: id++, type: "bug", line: f.line, msg: f.message, fix: f.suggestion || "", severity: f.severity || "medium", source: "bug-agent" });
  }

  for (const f of securityFindings) {
    finalReview.push({ id: id++, type: "security", line: f.line, msg: `${f.rule}: ${f.message}`, fix: `Severity: ${f.severity}`, rule: f.rule, severity: f.severity, source: "semgrep" });
  }

  for (const i of aiResult.criticalIssues) finalReview.push({ id: id++, type: "critical", line: i.line, msg: i.message, fix: "" , source: "ai" });
  for (const i of aiResult.warnings) finalReview.push({ id: id++, type: "warning", line: i.line, msg: i.message, fix: "", source: "ai" });
  for (const s of aiResult.suggestions) finalReview.push({ id: id++, type: "style", line: 0, msg: s.message, fix: "", source: "ai" });

  return {
    bugFindings: bugFindings || [],
    securityFindings,
    aiReview: aiResult,
    finalReview,
    score: aiResult.score,
    summary: "AI-based static analysis completed.",
    issues: finalReview,
  };
}

export async function runRepoSummary(repoName, repoData) {
  const prompt = `Summarize repository ${repoName} in JSON {summary,majorRisks,prioritizedIssues,actionableSuggestions}`;
  const resp = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
  return safeParseAI(resp.text) || { summary: "", majorRisks: [], prioritizedIssues: [], actionableSuggestions: [] };
}

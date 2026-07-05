import { GoogleGenAI } from "@google/genai";
import { securityAgent } from "../agents/securityAgent.js";
import { bugAgent } from "../agents/bugAgent.js";
import { synthesizerAgent } from "./synthesizerAgent.js";

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

  return synthesizerAgent({
    code,
    language,
    bugFindings: bugFindings || [],
    securityFindings,
    performanceFindings: [],
  });
}

export async function runRepoSummary(repoName, repoData) {
  const prompt = `Summarize repository ${repoName} in JSON {summary,majorRisks,prioritizedIssues,actionableSuggestions}`;
  const resp = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
  return safeParseAI(resp.text) || { summary: "", majorRisks: [], prioritizedIssues: [], actionableSuggestions: [] };
}

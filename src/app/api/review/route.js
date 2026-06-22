import { GoogleGenAI } from "@google/genai";
import { securityAgent } from "../../../../services/agents/securityAgent.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req) {
  try {
    const { code, language } = await req.json();

    if (!code || !language) {
      return Response.json(
        { error: "Code and language are required" },
        { status: 400 }
      );
    }

    // Run Semgrep first so security findings can guide the AI review.
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
    if (!match) throw new Error("No JSON found in response");

    const geminiResult = JSON.parse(match[0]);

    let id = 1;
    const finalReview = [];

    // Keep Semgrep findings in the final review list.
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

    // Merge AI findings into the same list.
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

    return Response.json({
      securityFindings,
      aiReview: geminiResult,
      finalReview,
      score: geminiResult.score ?? 0,
      summary: "AI-based static analysis completed.",
      issues: finalReview,
    });

  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Failed to analyze code", details: err.message },
      { status: 500 }
    );
  }
}

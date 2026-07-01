import { GoogleGenAI } from "@google/genai";
import { bugAgent } from "../../../../services/agents/bugAgent.js";
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

    const bugFindings = await bugAgent(code, language);

    // Run Semgrep next so security findings can guide the AI review.
    const securityFindings = await securityAgent(code, language);

    const prompt = `You are a friendly AI mentor helping students improve their code.

Guidelines:
- Be concise and beginner-friendly
- Explain issues in simple words
- Focus on learning and improvement
- Avoid harsh or judgmental language
- Prefer short, meaningful feedback

  Bug Findings:
  ${JSON.stringify(bugFindings, null, 2)}

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
- Critical issues = remaining crashes or logic problems
- Warnings = performance or bad practices
- Suggestions = style or learning tips (short)
Do not repeat the bug or security findings already listed above.

Code:
${code}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const raw = response.text;

    // Try to extract a JSON object from the AI response safely.
    let geminiResult = {};
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error("No JSON object found in AI response:", raw);
        geminiResult = {};
      } else {
        try {
          geminiResult = JSON.parse(match[0]);
        } catch (parseErr) {
          console.error("Failed parsing AI JSON:", parseErr, "raw object:", match[0]);

          // Attempt simple cleanup for common malformations (trailing commas).
          const cleaned = match[0].replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
          try {
            geminiResult = JSON.parse(cleaned);
            console.warn("Parsed AI JSON after cleaning trailing commas.");
          } catch (finalErr) {
            console.error("Unable to parse AI JSON even after cleanup:", finalErr);
            geminiResult = {};
          }
        }
      }
    } catch (e) {
      console.error("Unexpected error extracting AI JSON:", e);
      geminiResult = {};
    }

    let id = 1;
    const finalReview = [];

    for (const finding of bugFindings) {
      finalReview.push({
        id: id++,
        type: "bug",
        line: finding.line,
        msg: finding.message,
        fix: finding.suggestion || "Check the logic on this line.",
        severity: finding.severity || "medium",
        source: "bug-agent",
      });
    }

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
      bugFindings,
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

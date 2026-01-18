import { GoogleGenAI } from "@google/genai";

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

    const prompt = `You are a friendly AI mentor helping students improve their code.

Guidelines:
- Be concise and beginner-friendly
- Explain issues in simple words
- Focus on learning and improvement
- Avoid harsh or judgmental language
- Prefer short, meaningful feedback

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
    const issues = [];

    for (const i of geminiResult.criticalIssues || []) {
      issues.push({
        id: id++,
        type: "critical",
        line: i.line,
        msg: i.message,
        fix: "Add proper termination or refactor logic."
      });
    }

    for (const i of geminiResult.warnings || []) {
      issues.push({
        id: id++,
        type: "warning",
        line: i.line,
        msg: i.message,
        fix: "Optimize or simplify this logic."
      });
    }

    for (const i of geminiResult.suggestions || []) {
      issues.push({
        id: id++,
        type: "style",
        line: 0,
        msg: i.message,
        fix: "Apply best practice."
      });
    }

    return Response.json({
      score: geminiResult.score ?? 0,
      summary: "AI-based static analysis completed.",
      issues
    });

  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Failed to analyze code", details: err.message },
      { status: 500 }
    );
  }
}

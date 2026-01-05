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

    const prompt = `
You are a strict code reviewer.

Analyze the following ${language} code.
Return ONLY valid JSON in this format:
{
  "score": number,
  "criticalIssues": [{ "line": number, "message": string }],
  "warnings": [{ "line": number, "message": string }],
  "suggestions": [{ "message": string }]
}

Code:
${code}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

   const raw = response.text;

const match = raw.match(/\{[\s\S]*\}/);  //raw.match is used to extract JSON object from text
if (!match) {
  throw new Error("No JSON found in Gemini response");
}

const json = JSON.parse(match[0]);
return Response.json(json);

  } catch (err) {
    console.error(err);
    return Response.json(
      {
        error: "Failed to analyze code",
        details: err.message,
      },
      { status: 500 }
    );
  }
}

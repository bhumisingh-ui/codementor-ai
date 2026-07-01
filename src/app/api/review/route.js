import { runCodeReview } from "../../../../services/review/runCodeReview.js";

export async function POST(req) {
  try {
    const { code, language } = await req.json();

    if (!code || !language) {
      return Response.json(
        { error: "Code and language are required" },
        { status: 400 }
      );
    }

    const reviewResult = await runCodeReview(code, language);
    return Response.json(reviewResult);
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: "Failed to analyze code", details: err.message },
      { status: 500 }
    );
  }
}

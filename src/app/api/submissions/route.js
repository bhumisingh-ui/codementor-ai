import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import Submission from "@/models/Submission";
import { handleError } from "@/lib/errorHandler";

export async function POST(req) {
  try {
    await connectDB();

    // 1. Read token from cookies
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", status: 401 },
        { status: 401 }
      );
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Read request body
    const { code, language, problemTitle } = await req.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Code is required", status: 400 },
        { status: 400 }
      );
    }

    // 4. Save submission
    const submission = await Submission.create({
      userId: decoded.id,
      code,
      language,
      problemTitle,
    });

    return NextResponse.json(
      { message: "Submission saved", submission },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = handleError(error, { route: "/api/submissions" });
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}

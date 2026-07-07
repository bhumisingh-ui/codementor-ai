import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import Submission from "@/models/Submission";
import { handleError } from "@/lib/errorHandler";

export async function GET(req) {
  try {
    await connectDB();

    // 1. Read token
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", status: 401 },
        { status: 401 }
      );
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Fetch submissions for this user
    const submissions = await Submission.find({
      userId: decoded.id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ submissions });
  } catch (error) {
    const errorResponse = handleError(error, { route: "/api/submissions/history" });
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}

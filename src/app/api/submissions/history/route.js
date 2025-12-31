import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import Submission from "@/models/Submission";

export async function GET(req) {
  try {
    await connectDB();

    // 1. Read token
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
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
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

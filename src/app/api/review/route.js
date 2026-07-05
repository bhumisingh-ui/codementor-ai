import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import connectDB from "@/lib/db";
import Submission from "@/models/Submission";
import { reviewQueue } from "@/lib/queues/reviewQueue";
import { runCodeReview } from "../../../../services/review/runCodeReview.js";

export async function POST(req) {
  try {
    await connectDB();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const { code, language } = await req.json();

    if (!code || !language) {
      return Response.json({ error: "Code and language are required" }, { status: 400 });
    }

    const jobId = crypto.randomUUID();

    try {
      await Submission.create({
        userId: decoded.id,
        code,
        language,
        jobId,
        status: "queued",
      });
    } catch (dbErr) {
      console.error("Failed to create queued submission:", dbErr);
    }

    try {
      await reviewQueue.add(
        "review",
        {
          code,
          language,
          userId: decoded.id,
        },
        {
          jobId,
        }
      );

      return Response.json({ jobId, status: "queued" });
    } catch (queueErr) {
      console.error("Queue unavailable, falling back to synchronous review:", queueErr);

      const reviewResult = await runCodeReview(code, language);

      try {
        await Submission.findOneAndUpdate(
          { jobId, userId: decoded.id },
          {
            $set: {
              status: "completed",
              reviewResult,
              errorMessage: null,
            },
          },
          { new: true, upsert: true }
        );
      } catch (dbErr) {
        console.error("Failed to store fallback review result:", dbErr);
      }

      return Response.json({ jobId, status: "completed", reviewResult, fallback: true });
    }
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to analyze code", details: err.message }, { status: 500 });
  }
}

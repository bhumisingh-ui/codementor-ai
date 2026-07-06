import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import connectDB from "@/lib/db";
import Submission from "@/models/Submission";
import { reviewQueue } from "@/lib/queues/reviewQueue";
import { runCodeReview } from "../../../../services/review/runCodeReview.js";
import { handleError } from "@/lib/errorHandler";
import { logger } from "@/lib/logger";
import { reviewSchema } from "@/lib/validators/reviewSchema";
import { validate } from "@/lib/validators/validate";

export async function POST(req) {
  try {
    await connectDB();

    const token = req.cookies.get("token")?.value;
    if (!token) {
      return Response.json({ success: false, message: "Unauthorized", status: 401 }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const data = await req.json();

    // Validate request input
    const validationError = await validate(data, reviewSchema);
    if (validationError) {
      return Response.json(validationError, { status: 400 });
    }

    const { code, language } = data;

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
      logger.error("Failed to create queued submission", {
        route: "/api/review",
        userId: decoded.id,
        jobId,
        error: dbErr.message,
      });
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
      logger.error("Queue unavailable, falling back to synchronous review", {
        route: "/api/review",
        userId: decoded.id,
        jobId,
        error: queueErr.message,
      });

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
        logger.error("Failed to store fallback review result", {
          route: "/api/review",
          userId: decoded.id,
          jobId,
          error: dbErr.message,
        });
      }

      return Response.json({ jobId, status: "completed", reviewResult, fallback: true });
    }
  } catch (error) {
    const errorResponse = handleError(error, { route: "/api/review" });
    return Response.json(errorResponse, { status: errorResponse.status });
  }
}

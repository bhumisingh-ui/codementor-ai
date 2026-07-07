import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { createResetToken, getAppOrigin, getResetTokenExpiry } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { logger } from "@/lib/logger";
import { forgotPasswordSchema } from "@/lib/validators/forgotPasswordSchema";
import { validate } from "@/lib/validators/validate";

const GENERIC_RESET_RESPONSE = {
  message: "If an account exists, a reset link has been sent.",
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const attempts = new Map();

function getClientIp(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(key) {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || record.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > MAX_REQUESTS;
}

function genericResponse(status = 200) {
  return NextResponse.json(GENERIC_RESET_RESPONSE, { status });
}

export async function POST(req) {
  try {
    const data = await req.json();
    const validationError = await validate(data, forgotPasswordSchema);
    if (validationError) {
      return NextResponse.json(validationError, { status: 400 });
    }

    const normalizedEmail = data.email;
    const clientIp = getClientIp(req);
    const rateLimitKey = `${clientIp}:${normalizedEmail}`;

    if (isRateLimited(rateLimitKey)) {
      logger.warn("Password reset request rate limited", {
        service: "auth",
        route: "/api/auth/forgot-password",
      });
      return genericResponse(429);
    }

    await connectDB();

    const user = await User.findOne({ email: normalizedEmail });

    logger.info("Password reset requested", {
      service: "auth",
      route: "/api/auth/forgot-password",
    });

    if (user?.password) {
      const { token, tokenHash } = createResetToken();
      user.resetTokenHash = tokenHash;
      user.resetTokenExpiresAt = getResetTokenExpiry();
      await user.save();

      const resetUrl = `${getAppOrigin(req)}/reset-password?token=${token}`;

      try {
        await sendPasswordResetEmail({ to: normalizedEmail, resetUrl });
      } catch (error) {
        user.resetTokenHash = null;
        user.resetTokenExpiresAt = null;
        await user.save();

        logger.error("Password reset email delivery failed", {
          service: "auth",
          route: "/api/auth/forgot-password",
          error: error?.code || error?.message || "unknown",
        });
      }
    }

    return genericResponse();
  } catch (error) {
    logger.error("Password reset request failed", {
      service: "auth",
      route: "/api/auth/forgot-password",
      error: error?.message || "unknown",
    });

    return genericResponse();
  }
}

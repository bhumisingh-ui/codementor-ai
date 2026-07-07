import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { hashResetToken } from "@/lib/passwordReset";
import { logger } from "@/lib/logger";
import { resetPasswordSchema } from "@/lib/validators/resetPasswordSchema";
import { validate } from "@/lib/validators/validate";

function clearAuthCookie(response) {
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return response;
}

export async function POST(req) {
  try {
    const data = await req.json();
    const validationError = await validate(data, resetPasswordSchema);
    if (validationError) {
      return NextResponse.json(validationError, { status: 400 });
    }

    await connectDB();

    const tokenHash = hashResetToken(data.token);
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.findOneAndUpdate(
      {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: { $gt: new Date() },
      },
      {
        $set: { password: hashedPassword },
        $unset: { resetTokenHash: "", resetTokenExpiresAt: "" },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: "Reset link is invalid, expired, or already used" },
        { status: 400 }
      );
    }

    logger.info("Password reset completed", {
      service: "auth",
      route: "/api/auth/reset-password",
      userId: user._id?.toString(),
    });

    const response = NextResponse.json({ message: "Password updated successfully" });
    return clearAuthCookie(response);
  } catch (error) {
    logger.error("Password reset failed", {
      service: "auth",
      route: "/api/auth/reset-password",
      error: error?.message || "unknown",
    });

    return NextResponse.json(
      { error: "Unable to reset password" },
      { status: 500 }
    );
  }
}

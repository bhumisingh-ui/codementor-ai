import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { createResetToken, getAppOrigin } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req) {
  try {
    await connectDB();

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      // Store only a hash so the raw reset token never lives in MongoDB.
      const { token, tokenHash } = createResetToken();
      user.resetTokenHash = tokenHash;
      user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const resetUrl = `${getAppOrigin(req)}/reset-password?email=${encodeURIComponent(normalizedEmail)}&token=${token}`;
      await sendPasswordResetEmail({ to: normalizedEmail, resetUrl });
    }

    return NextResponse.json({
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return NextResponse.json(
      { error: "Unable to send reset link right now" },
      { status: 500 }
    );
  }
}
import nodemailer from "nodemailer";

function logPasswordResetFallback(resetUrl, reason) {
  console.warn(`[password-reset] Email was not sent (${reason}).`);

  if (process.env.ALLOW_DEV_RESET_LINK_LOG === "true" && process.env.NODE_ENV !== "production") {
    console.log(`[password-reset] Development reset link: ${resetUrl}`);
  }
}

function hasEmailConfig() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  if (!hasEmailConfig()) {
    if (process.env.NODE_ENV !== "production") {
      logPasswordResetFallback(resetUrl, "missing EMAIL_USER or EMAIL_PASS");
      return;
    }

    throw new Error("Email provider is not configured");
  }

  try {
    await createTransporter().sendMail({
      from: `"CodeMentor AI" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Reset your CodeMentor AI password",
      html: `
        <h2>Password Reset</h2>
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetUrl}"
             style="background:#00e676;color:#000;padding:12px 18px;
                    text-decoration:none;border-radius:6px;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
      text: `Reset your password: ${resetUrl}`,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && error?.code === "EAUTH") {
      logPasswordResetFallback(resetUrl, "Gmail authentication failed");
      return;
    }

    throw error;
  }
}

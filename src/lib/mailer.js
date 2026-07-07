export async function sendPasswordResetEmail({ to, resetUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[password-reset] ${to}: ${resetUrl}`);
      return;
    }

    throw new Error("Email provider is not configured");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Reset your Codementor AI password",
      html: `
        <p>We received a request to reset your password.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
      text: `Reset your password: ${resetUrl}`,
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`Failed to send email: ${details}`);
  }
}
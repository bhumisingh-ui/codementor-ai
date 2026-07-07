import crypto from "crypto";

export function createResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  return { token, tokenHash };
}

export function getAppOrigin(req) {
  const origin = req.headers.get("origin");
  if (origin) return origin;

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
import crypto from "crypto";

export const RESET_TOKEN_TTL_MINUTES = 30;

export function createResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(token);

  return { token, tokenHash };
}

export function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getResetTokenExpiry() {
  return new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
}

export function getAppOrigin(req) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (configuredOrigin) {
    if (process.env.NODE_ENV === "production" && !configuredOrigin.startsWith("https://")) {
      throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS in production");
    }

    return configuredOrigin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL is required in production");
  }

  const requestOrigin = req.headers.get("origin");
  if (requestOrigin) return requestOrigin.replace(/\/$/, "");

  return "http://localhost:3000";
}

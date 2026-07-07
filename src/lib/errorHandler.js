import { logger } from "./logger.js";

export function handleError(error, context = {}) {
  const status = error?.status || error?.statusCode || 500;
  const message = error?.message || "Internal Server Error";

  logger.error(message, {
    service: context.service || "review-api",
    route: context.route,
    userId: context.userId,
    jobId: context.jobId,
    error: error?.message || String(error),
  });

  return {
    success: false,
    message: status === 500 ? "Internal Server Error" : message,
    status,
  };
}

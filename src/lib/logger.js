function writeLog(level, message, metadata = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: metadata.service || "codementor-ai",
    message,
    ...Object.fromEntries(
      Object.entries(metadata).filter(([, v]) => v !== undefined)
    ),
  };

  const logMethod = level === "WARN" ? "warn" : level === "ERROR" ? "error" : "info";
  console[logMethod](payload);
}

export const logger = {
  info(message, metadata = {}) {
    writeLog("INFO", message, metadata);
  },
  warn(message, metadata = {}) {
    writeLog("WARN", message, metadata);
  },
  error(message, metadata = {}) {
    writeLog("ERROR", message, metadata);
  },
};

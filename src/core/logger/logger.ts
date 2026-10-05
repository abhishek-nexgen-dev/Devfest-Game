export const logger = {
  info: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(`[INFO] [${new Date().toISOString()}] ${message}`, meta ?? "");
    }
  },
  warn: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== "test") {
      console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, meta ?? "");
    }
  },
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV !== "test") {
      console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, error ?? "");
    }
  },
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, meta ?? "");
    }
  },
};

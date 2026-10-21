import dns from "node:dns";
import app from "./app";
import { env_Constant } from "./constants/env.constant";
import pg, { connectDatabase } from "./core/database/postgres";
import initSchemas from "./core/database/schema";
import { logger } from "./core/logger/logger";
import { authService } from "./api/v1/auth/Auth.Service";
import authUtils from "./api/v1/auth/AuthUtils";

// Prefer IPv4 resolution order to prevent ENETUNREACH on IPv4-only cloud hosts like Render
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

// Render injects PORT dynamically at runtime; always prioritize process.env.PORT
const PORT = Number(process.env.PORT) || env_Constant.PORT || 3000;
const HOST = "0.0.0.0";

/**
 * Resilient Database Connection with Exponential Backoff
 * Prevents container crash on Render if the database takes a few seconds to warm up
 */
const connectWithRetry = async (maxRetries = 5, delayMs = 2500): Promise<void> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      await connectDatabase();
      return;
    } catch (err: any) {
      attempt++;
      logger.warn(
        `🐘 Database connection attempt ${attempt}/${maxRetries} failed: ${err.message}. Retrying in ${delayMs / 1000}s...`,
      );
      if (attempt >= maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

const startServer = async () => {
  try {
    await connectWithRetry(5, 2500);
    await initSchemas();

    // Auto-seed initial super admin if no super admin exists yet
    try {
      const superAdminCount = await authUtils.Count_Users_By_Role("SUPER_ADMIN");
      if (superAdminCount === 0) {
        await authService.initSuperAdmin();
        logger.info("👑 Initial Super Admin automatically seeded for new database.");
      }
    } catch (seedErr: any) {
      logger.warn(`Super admin seeding note: ${seedErr.message}`);
    }

    const server = app.listen(PORT, HOST, () => {
      logger.info(`====================================================`);
      logger.info(`🚀 GDG Ranchi DevFest 2026 Game Backend is Running!`);
      logger.info(`🌐 Port: http://${HOST}:${PORT}`);
      logger.info(`📡 API Prefix: http://${HOST}:${PORT}${env_Constant.API_PREFIX}`);
      logger.info(`🩺 Health Check: http://${HOST}:${PORT}/health`);
      logger.info(`🐘 Database: PostgreSQL (${env_Constant.DB_NAME})`);
      logger.info(`🔧 Environment: ${env_Constant.NODE_ENV}`);
      logger.info(`====================================================`);
    });

    // Handle graceful shutdown on Render (SIGTERM/SIGINT)
    const handleShutdown = async (signal: string) => {
      logger.info(`🛑 ${signal} received. Closing HTTP server and database pool...`);
      server.close(async () => {
        try {
          await pg.end();
          logger.info("✅ Database connections closed cleanly.");
        } catch (poolErr: any) {
          logger.error("Error closing database pool:", poolErr.message);
        }
        process.exit(0);
      });

      // Force shutdown after 10 seconds if hanging
      setTimeout(() => {
        logger.error("⚠️ Forced shutdown after timeout.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

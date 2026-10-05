import app from "./app";
import { env_Constant } from "./constants/env.constant";
import { connectDB, disconnectDB } from "./core/database/db.config";
import { logger } from "./core/logger/logger";

const PORT = 3000;
const HOST = "0.0.0.0";

const startServer = async () => {
  try {
    // Connect to Cloud Firestore Enterprise
    await connectDB();

    const server = app.listen(PORT, HOST, () => {
      logger.info(`====================================================`);
      logger.info(`🚀 GDG Ranchi DevFest 2026 Game Backend is Running!`);
      logger.info(`🌐 Port: http://${HOST}:${PORT}`);
      logger.info(`📡 API Prefix: http://${HOST}:${PORT}${env_Constant.API_PREFIX}`);
      logger.info(`🩺 Health Check: http://${HOST}:${PORT}/health`);
      logger.info(`🔧 Environment: ${env_Constant.NODE_ENV}`);
      logger.info(`====================================================`);
    });

    // Graceful Termination Handlers
    const handleShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        logger.info("Process terminated cleanly.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

import app from "./app";
import { env_Constant } from "./constants/env.constant";
import { connectDatabase } from "./core/database/postgres";
import initSchemas from "./core/database/schema";
import { logger } from "./core/logger/logger";
import { authService } from "./api/v1/auth/Auth.Service";
import authUtils from "./api/v1/auth/AuthUtils";

const PORT = env_Constant.PORT || 3000;
const HOST = "0.0.0.0";

const startServer = async () => {
  try {
    await connectDatabase();
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

    app.listen(PORT, HOST, () => {
      logger.info(`====================================================`);
      logger.info(`🚀 GDG Ranchi DevFest 2026 Game Backend is Running!`);
      logger.info(`🌐 Port: http://${HOST}:${PORT}`);
      logger.info(`📡 API Prefix: http://${HOST}:${PORT}${env_Constant.API_PREFIX}`);
      logger.info(`🩺 Health Check: http://${HOST}:${PORT}/health`);
      logger.info(`🐘 Database: PostgreSQL (${env_Constant.DB_NAME})`);
      logger.info(`🔧 Environment: ${env_Constant.NODE_ENV}`);
      logger.info(`====================================================`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

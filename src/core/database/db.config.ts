import { testPostgresConnection, closePostgresConnection, getDbStatus } from "./sql.connect";
import { logger } from "../logger/logger";
import { env_Constant } from "../../constants/env.constant";

/**
 * Initializes and validates PostgreSQL database connection.
 * Gracefully handles offline local database in development while enforcing in production.
 */
export const connectDB = async (): Promise<void> => {
  try {
    await testPostgresConnection();
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    const reason =
      err.code === "ECONNREFUSED"
        ? "Connection refused (no PostgreSQL instance running on target host/port)"
        : err.message || "Connection failed";

    if (env_Constant.NODE_ENV === "production") {
      logger.error("❌ Fatal: Failed to connect to Google Cloud SQL (PostgreSQL):", reason);
      process.exit(1);
    } else {
      logger.warn(`⚠️ PostgreSQL connection not established: ${reason}`);
      logger.warn(
        `ℹ️ Backend is running in development mode without an active database connection.`,
      );
      logger.warn(
        `💡 To connect, configure DATABASE_URL in your .env file with your Google Cloud SQL connection string or start local PostgreSQL.`,
      );
    }
  }
};

/**
 * Gracefully terminates the PostgreSQL connection pool.
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await closePostgresConnection();
  } catch (error) {
    logger.error("Error during PostgreSQL disconnection:", error);
  }
};

export { getDbStatus };

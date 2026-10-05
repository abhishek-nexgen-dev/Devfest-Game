import { testPostgresConnection, closePostgresConnection } from "./sql.connect";
import { logger } from "../logger/logger";
import { env_Constant } from "../../constants/env.constant";

/**
 * Initializes and validates PostgreSQL database connection.
 */
export const connectDB = async (): Promise<void> => {
  try {
    await testPostgresConnection();
  } catch (error) {
    logger.error("Failed to connect to Google Cloud SQL (PostgreSQL):", error);
    if (env_Constant.NODE_ENV === "production") {
      process.exit(1);
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

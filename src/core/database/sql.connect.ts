import { Pool, PoolConfig } from "pg";
import { env_Constant } from "../../constants/env.constant";
import { logger } from "../logger/logger";

let isDatabaseConnected = false;

/**
 * Returns current database connection state.
 */
export const getDbStatus = (): boolean => isDatabaseConnected;

const requiresSsl =
  env_Constant.NODE_ENV === "production" ||
  env_Constant.DATABASE_URL.includes("sslmode=require") ||
  env_Constant.DATABASE_URL.includes("cloudsql");

/**
 * PostgreSQL Direct Pool Connection
 * Configured for Google Cloud SQL (PostgreSQL) with SSL and connection pooling.
 */
const poolConfig: PoolConfig = {
  connectionString: env_Constant.DATABASE_URL,
  max: 20, // Max concurrent connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
  ssl: requiresSsl
    ? {
        rejectUnauthorized: false, // For Google Cloud SQL SSL certificates
      }
    : false,
};

export const pgPool = new Pool(poolConfig);

pgPool.on("connect", () => {
  logger.debug("New client connected to Google Cloud PostgreSQL pool.");
});

pgPool.on("error", (err) => {
  logger.error("Unexpected error on idle PostgreSQL client:", err);
});

/**
 * Verifies active database connection by executing a lightweight query.
 */
export const testPostgresConnection = async (): Promise<boolean> => {
  try {
    const client = await pgPool.connect();
    try {
      const res = await client.query("SELECT NOW() as current_time, version() as version;");
      isDatabaseConnected = true;
      logger.info("✅ Google Cloud SQL (PostgreSQL) connected successfully.");
      logger.debug(`Database server timestamp: ${res.rows[0].current_time}`);
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    isDatabaseConnected = false;
    throw error;
  }
};

/**
 * Closes all connections in the pool gracefully.
 */
export const closePostgresConnection = async (): Promise<void> => {
  try {
    await pgPool.end();
    isDatabaseConnected = false;
    logger.info("Google Cloud SQL (PostgreSQL) pool connection closed.");
  } catch (error) {
    logger.error("Error closing PostgreSQL pool:", error);
  }
};

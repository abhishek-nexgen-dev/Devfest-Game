import { Pool, PoolConfig } from "pg";
import { env_Constant } from "../../constants/env.constant";
import { logger } from "../logger/logger";

/**
 * PostgreSQL Direct Pool Connection
 * Configured for Google Cloud SQL (PostgreSQL) with SSL and connection pooling.
 */
const poolConfig: PoolConfig = {
  connectionString: env_Constant.DATABASE_URL,
  max: 20, // Max concurrent connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl:
    env_Constant.NODE_ENV === "production"
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
export const testPostgresConnection = async (): Promise<void> => {
  const client = await pgPool.connect();
  try {
    const res = await client.query("SELECT NOW() as current_time, version() as version;");
    logger.info("✅ Google Cloud SQL (PostgreSQL) connected via native pg driver.");
    logger.debug(`Database server timestamp: ${res.rows[0].current_time}`);
  } finally {
    client.release();
  }
};

/**
 * Closes all connections in the pool gracefully.
 */
export const closePostgresConnection = async (): Promise<void> => {
  try {
    await pgPool.end();
    logger.info("Google Cloud SQL (PostgreSQL) pool connection closed.");
  } catch (error) {
    logger.error("Error closing PostgreSQL pool:", error);
  }
};

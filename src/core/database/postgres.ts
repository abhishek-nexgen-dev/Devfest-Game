import { Client, Pool } from "pg";
import "dotenv/config";

const targetDbName =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_DB_NAME || "devfest_game_test_db"
    : process.env.DB_NAME || "devfest_game_db";

const dbConfig = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: targetDbName,
  password: process.env.DB_PASSWORD || "postgres",
  port: Number(process.env.DB_PORT) || 5432,
};

const pg = new Pool({
  ...dbConfig,
  options: "-c search_path=public",
});

pg.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

/**
 * Ensures the target PostgreSQL database exists and verifies the connection pool.
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pg.connect();
    console.log("DB Connected successfully");
    const result = await client.query("SELECT current_database(), current_user");
    console.log(result.rows);
    client.release();
  } catch (err: any) {
    // PostgreSQL error code 3D000 = invalid_catalog_name (database does not exist)
    if (err?.code === "3D000") {
      const adminClient = new Client({
        user: dbConfig.user,
        host: dbConfig.host,
        database: "postgres",
        password: dbConfig.password,
        port: dbConfig.port,
      });

      await adminClient.connect();
      const safeDbName = dbConfig.database.replace(/[^a-zA-Z0-9_]/g, "");
      await adminClient.query(`CREATE DATABASE "${safeDbName}";`);
      await adminClient.end();

      const client = await pg.connect();
      console.log("DB Connected successfully");
      const result = await client.query("SELECT current_database(), current_user");
      console.log(result.rows);
      client.release();
      return;
    }

    console.error("Error acquiring client", err.stack || err.message);
    throw err;
  }
};

export { pg };
export default pg;

import { Client, Pool, type PoolConfig } from "pg";
import "dotenv/config";
import { env_Constant } from "../../constants/env.constant";

const targetDbName =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_DB_NAME || "devfest_game_test_db"
    : process.env.DB_NAME || env_Constant.DB_NAME || "devfest_game_db";

const dbHost = process.env.DB_HOST || env_Constant.DB_HOST || "localhost";

const isRemoteHost = Boolean(
  (dbHost && dbHost !== "localhost" && dbHost !== "127.0.0.1" && dbHost !== "postgres") ||
  process.env.DATABASE_URL?.includes("supabase") ||
  env_Constant.DATABASE_URL?.includes("supabase") ||
  process.env.DATABASE_URL?.includes("pooler") ||
  process.env.DATABASE_URL?.includes("render.com") ||
  process.env.NODE_ENV === "production",
);

const useSsl =
  process.env.DB_SSL !== undefined
    ? process.env.DB_SSL === "true" || process.env.DB_SSL === "1"
    : env_Constant.DB_SSL || isRemoteHost;

const sslConfig = useSsl ? { rejectUnauthorized: false } : false;

const connectionString = process.env.DATABASE_URL || env_Constant.DATABASE_URL;

const dbConfig: PoolConfig = connectionString
  ? {
      connectionString,
      ssl: sslConfig,
    }
  : {
      user: process.env.DB_USER || env_Constant.DB_USER || "postgres",
      host: dbHost,
      database: targetDbName,
      password: process.env.DB_PASSWORD || env_Constant.DB_PASSWORD || "",
      port: Number(process.env.DB_PORT) || env_Constant.DB_PORT || 5432,
      ssl: sslConfig,
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
    if (err?.code === "3D000" && !connectionString) {
      const adminClient = new Client({
        user: dbConfig.user,
        host: dbConfig.host,
        database: "postgres",
        password: dbConfig.password,
        port: dbConfig.port,
        ssl: sslConfig,
      });

      await adminClient.connect();
      const safeDbName = (dbConfig.database || targetDbName).replace(/"/g, '""');
      await adminClient.query(`CREATE DATABASE "${safeDbName}";`);
      await adminClient.end();

      const client = await pg.connect();
      console.log("DB Connected successfully");
      const result = await client.query("SELECT current_database(), current_user");
      console.log(result.rows);
      client.release();
      return;
    }

    if (err?.code === "ENETUNREACH" || String(err?.message).includes("ENETUNREACH")) {
      console.error(
        "\n🚨 [IPv6 Routing Error]: Render cannot reach direct Supabase IPv6 endpoints.\n" +
          "👉 Resolution: Update DATABASE_URL in Render to use Supabase Connection Pooler (Supavisor):\n" +
          "   Format: postgresql://postgres.[project-ref]:[encoded-password]@aws-0-[region].pooler.supabase.com:6543/postgres\n",
      );
    }

    console.error("Error acquiring client", err.stack || err.message);
    throw err;
  }
};

export { pg };
export default pg;

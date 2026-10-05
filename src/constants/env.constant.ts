import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Zod Schema for Environment Configuration
 * Validates Google Cloud PostgreSQL, Firebase Storage, JWT, and Server settings.
 */
export const envSchema = z.object({
  // Server Configuration
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PREFIX: z.string().default("/api/v1"),
  CORS_ORIGIN: z.string().default("*"),

  // Google Cloud PostgreSQL Database
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .default("postgresql://postgres:postgres@localhost:5432/devfest_game_db?schema=public"),
  DIRECT_URL: z.string().optional(),

  // JWT Authentication
  JWT_SECRET: z
    .string()
    .min(8, "JWT_SECRET must be at least 8 characters")
    .default("devfest_super_secret_jwt_key_2026"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Initial Super Admin Seed Credentials
  INITIAL_ADMIN_EMAIL: z.string().email().default("admin@gdgranchi.in"),
  INITIAL_ADMIN_PASSWORD: z.string().min(6).default("AdminPass@2026"),
  INITIAL_ADMIN_NAME: z.string().default("GDG Ranchi Super Admin"),

  // Firebase Storage (Google Cloud / Firebase)
  FIREBASE_PROJECT_ID: z.string().optional().default(""),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default(""),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(""),
  FIREBASE_STORAGE_BUCKET: z.string().optional().default(""),

  // Email Configuration (SMTP)
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("GDG Ranchi DevFest <devfest@gdgranchi.in>"),
});

export type EnvConfig = z.infer<typeof envSchema>;

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const formattedErrors = parsedEnv.error.errors
    .map((err) => `  - ${err.path.join(".")}: ${err.message}`)
    .join("\n");

  console.error("❌ Invalid environment variables configuration:\n" + formattedErrors);

  if (process.env.NODE_ENV !== "test") {
    process.exit(1);
  }
}

export const env_Constant: EnvConfig = parsedEnv.success
  ? parsedEnv.data
  : (envSchema.parse({}) as EnvConfig);

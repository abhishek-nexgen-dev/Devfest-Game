import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Zod Schema for Environment Configuration
 * Validates PostgreSQL (pg), JWT, SMTP, and Server settings.
 */
export const envSchema = z.object({
  // Server Configuration
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PREFIX: z.string().default("/api/v1"),
  CORS_ORIGIN: z.string().default("*"),

  // PostgreSQL Database Configuration (pg)
  DATABASE_URL: z.string().optional(),
  DB_USER: z.string().default("postgres"),
  DB_HOST: z.string().default("localhost"),
  DB_NAME: z.string().default("devfest_game_db"),
  DB_PASSWORD: z.string().default("postgres"),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_SSL: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => val === true || val === "true" || val === "1")
    .default(false),

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

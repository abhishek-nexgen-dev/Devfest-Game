import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Zod Schema for Environment Configuration
 * Validates PostgreSQL (pg), JWT, SMTP, and Server settings.
 * All secrets MUST be provided via .env (no hardcoded credentials allowed).
 */
export const envSchema = z.object({
  // Server Configuration
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PREFIX: z.string().default("/api/v1"),
  CORS_ORIGIN: z.string().default("*"),

  // PostgreSQL Database Configuration (pg)
  DATABASE_URL: z.string().optional(),
  DB_USER: z.string().optional().default("postgres"),
  DB_HOST: z.string().optional().default("localhost"),
  DB_NAME: z.string().optional().default("devfest_game_db"),
  DB_PASSWORD: z.string().optional().default(""),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_SSL: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => val === true || val === "true" || val === "1")
    .default(false),

  // JWT Authentication (Must be set in .env)
  JWT_SECRET: z
    .string({ required_error: "JWT_SECRET must be defined in .env" })
    .min(8, "JWT_SECRET must be at least 8 characters")
    .default(process.env.NODE_ENV === "test" ? "test_jwt_secret_key_12345" : undefined as any),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Initial Super Admin Seed Credentials (Must be set in .env)
  INITIAL_ADMIN_EMAIL: z
    .string({ required_error: "INITIAL_ADMIN_EMAIL must be defined in .env" })
    .email()
    .default(process.env.NODE_ENV === "test" ? "admin@test.com" : undefined as any),
  INITIAL_ADMIN_PASSWORD: z
    .string({ required_error: "INITIAL_ADMIN_PASSWORD must be defined in .env" })
    .min(6, "INITIAL_ADMIN_PASSWORD must be at least 6 characters")
    .default(process.env.NODE_ENV === "test" ? "TestPass@123" : undefined as any),
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
  : (envSchema.parse(
      process.env.NODE_ENV === "test"
        ? {
            JWT_SECRET: "test_jwt_secret_key_12345",
            INITIAL_ADMIN_EMAIL: "admin@test.com",
            INITIAL_ADMIN_PASSWORD: "TestPass@123",
          }
        : {},
    ) as EnvConfig);

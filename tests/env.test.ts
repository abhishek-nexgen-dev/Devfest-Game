import { envSchema } from "../src/constants/env.constant";
import { afterAll, beforeAll, describe, afterEach, expect, it, test, jest } from "@jest/globals";

describe("Environment Validation with Zod", () => {
  it("should validate and parse default environment variables correctly", () => {
    const result = envSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(5000);
      expect(result.data.NODE_ENV).toBe("development");
      expect(result.data.API_PREFIX).toBe("/api/v1");
      expect(result.data.INITIAL_ADMIN_EMAIL).toBe("admin@gdgranchi.in");
    }
  });

  it("should accept valid custom configuration", () => {
    const customEnv = {
      PORT: "8080",
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:pass@10.0.0.1:5432/custom_db",
      JWT_SECRET: "my_very_secure_jwt_secret_key_12345",
      FIREBASE_PROJECT_ID: "gdg-ranchi-custom",
      FIREBASE_STORAGE_BUCKET: "gdg-ranchi.appspot.com",
    };

    const result = envSchema.safeParse(customEnv);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(8080);
      expect(result.data.NODE_ENV).toBe("production");
      expect(result.data.DATABASE_URL).toBe(customEnv.DATABASE_URL);
      expect(result.data.FIREBASE_PROJECT_ID).toBe("gdg-ranchi-custom");
    }
  });

  it("should fail validation when invalid email is provided for initial admin", () => {
    const invalidEnv = {
      INITIAL_ADMIN_EMAIL: "not-an-email",
    };

    const result = envSchema.safeParse(invalidEnv);

    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.errors.find((e) => e.path.includes("INITIAL_ADMIN_EMAIL"));
      expect(emailError).toBeDefined();
    }
  });

  it("should fail validation when JWT_SECRET is too short", () => {
    const invalidEnv = {
      JWT_SECRET: "short",
    };

    const result = envSchema.safeParse(invalidEnv);

    expect(result.success).toBe(false);
  });
});

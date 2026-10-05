import { envSchema } from "../src/constants/env.constant";
import { describe, expect, it } from "@jest/globals";

describe("Environment Validation with Zod", () => {
  it("should validate and parse default environment variables correctly", () => {
    const result = envSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3000);
      expect(result.data.NODE_ENV).toBe("development");
      expect(result.data.API_PREFIX).toBe("/api/v1");
      expect(result.data.INITIAL_ADMIN_EMAIL).toBe("admin@gdgranchi.in");
      expect(result.data.FIRESTORE_DATABASE_ID).toBe(
        "ai-studio-devfestgame-ca5cb9b4-9f77-480c-b389-e5947a48e0d6",
      );
    }
  });

  it("should accept valid custom configuration", () => {
    const customEnv = {
      PORT: "8080",
      NODE_ENV: "production",
      FIRESTORE_DATABASE_ID: "custom-firestore-db",
      JWT_SECRET: "my_very_secure_jwt_secret_key_12345",
      FIREBASE_PROJECT_ID: "gdg-ranchi-custom",
      FIREBASE_STORAGE_BUCKET: "gdg-ranchi.appspot.com",
    };

    const result = envSchema.safeParse(customEnv);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(8080);
      expect(result.data.NODE_ENV).toBe("production");
      expect(result.data.FIRESTORE_DATABASE_ID).toBe("custom-firestore-db");
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

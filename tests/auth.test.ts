import request from "supertest";
import app from "../src/app";
import { AuthUtils } from "../src/api/v1/auth/auth.utils";
import { AuthValidator } from "../src/api/v1/auth/auth.validator";
import { AuthService } from "../src/api/v1/auth/auth.service";
import { AuthConstants } from "../src/api/v1/auth/auth.constants";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

describe("Authentication Module Tests", () => {
  const authService = new AuthService();

  describe("AuthUtils Unit Tests", () => {
    it("should hash and verify passwords using bcrypt", async () => {
      const plain = "DevFest@2026";
      const hash = await AuthUtils.HASH_PASSWORD(plain);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(plain);

      const isValid = await AuthUtils.COMPARE_PASSWORD(plain, hash);
      expect(isValid).toBe(true);

      const isInvalid = await AuthUtils.COMPARE_PASSWORD("WrongPassword1", hash);
      expect(isInvalid).toBe(false);
    });

    it("should generate and verify JWT access tokens", () => {
      const payload = {
        userId: "usr-unit-test-1",
        email: "unit@gdgranchi.in",
        role: AuthConstants.ROLES.PARTICIPANT,
        participantId: "GDGR-1099",
      };

      const token = AuthUtils.GENERATE_ACCESS_TOKEN(payload);
      expect(typeof token).toBe("string");

      const decoded = AuthUtils.VERIFY_ACCESS_TOKEN(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.participantId).toBe(payload.participantId);
    });

    it("should generate formatted Participant IDs with prefix", () => {
      const id = AuthUtils.GENERATE_PARTICIPANT_ID("GDGR");
      expect(id).toMatch(/^GDGR-\d{4}$/);
    });

    it("should sanitize user objects by removing password field", () => {
      const user = {
        id: "1",
        email: "test@gdg.org",
        password: "secret_bcrypt_hash",
        role: "PARTICIPANT",
      };
      const sanitized = AuthUtils.SANITIZE_USER(user);
      expect(sanitized).not.toHaveProperty("password");
      expect(sanitized.email).toBe("test@gdg.org");
    });

    it("should normalize email addresses", () => {
      expect(AuthUtils.NORMALIZE_EMAIL("  John.Doe@GDG.ORG  ")).toBe("john.doe@gdg.org");
    });
  });

  describe("AuthValidator Unit Tests", () => {
    it("should validate valid registration payload", () => {
      const valid = {
        name: "Abhishek Kumar",
        email: "abhishek@example.com",
        password: "SecurePassword123",
        confirmPassword: "SecurePassword123",
        mobile: "+919876543210",
      };

      const parsed = AuthValidator.REGISTER_SCHEMA.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("should reject registration when password and confirmation mismatch", () => {
      const invalid = {
        name: "Abhishek Kumar",
        email: "abhishek@example.com",
        password: "SecurePassword123",
        confirmPassword: "DifferentPassword456",
        mobile: "+919876543210",
      };

      const parsed = AuthValidator.REGISTER_SCHEMA.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.errors[0].message).toContain(
          AuthConstants.MESSAGES.PASSWORDS_DO_NOT_MATCH,
        );
      }
    });

    it("should reject weak password without numbers", () => {
      const invalid = {
        name: "Abhishek Kumar",
        email: "abhishek@example.com",
        password: "onlyletterslongpassword",
        confirmPassword: "onlyletterslongpassword",
        mobile: "+919876543210",
      };

      const parsed = AuthValidator.REGISTER_SCHEMA.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it("should validate login schema", () => {
      expect(
        AuthValidator.LOGIN_SCHEMA.safeParse({
          email: "valid@gdg.org",
          password: "password123",
        }).success,
      ).toBe(true);

      expect(
        AuthValidator.LOGIN_SCHEMA.safeParse({
          email: "invalid-email",
          password: "password123",
        }).success,
      ).toBe(false);
    });
  });

  describe("AuthService Unit Tests", () => {
    it("should register a participant and allow lookup", async () => {
      const email = `test-${Date.now()}@gdgranchi.in`;
      const result = await authService.REGISTER_USER({
        name: "Ranchi Coder",
        email,
        password: "Password2026",
        mobile: "+919988776655",
        organization: "GDG",
        city: "Ranchi",
      });

      expect(result).toHaveProperty("token");
      expect(result.user.email).toBe(email);
      expect(result.participant).toBeDefined();
      expect(result.participant?.participantId).toMatch(/^GDGR-\d{4}$/);

      const foundUser = await authService.FIND_USER_BY_EMAIL(email);
      expect(foundUser).not.toBeNull();
      expect(foundUser?.email).toBe(email);
    });

    it("should reject duplicate registration for existing email", async () => {
      const email = `dupe-${Date.now()}@gdgranchi.in`;
      await authService.REGISTER_USER({
        name: "First User",
        email,
        password: "Password2026",
        mobile: "+919988776655",
      });

      await expect(
        authService.REGISTER_USER({
          name: "Second User",
          email,
          password: "Password2026",
          mobile: "+919988776655",
        }),
      ).rejects.toThrow(AuthConstants.MESSAGES.EMAIL_ALREADY_EXISTS);
    });

    it("should login user with correct credentials and reject invalid password", async () => {
      const email = `login-${Date.now()}@gdgranchi.in`;
      await authService.REGISTER_USER({
        name: "Login User",
        email,
        password: "SecretPassword123",
        mobile: "+919988776655",
      });

      const loginSuccess = await authService.LOGIN_USER({
        email,
        password: "SecretPassword123",
      });

      expect(loginSuccess.token).toBeDefined();
      expect(loginSuccess.user.email).toBe(email);

      await expect(
        authService.LOGIN_USER({
          email,
          password: "IncorrectPassword999",
        }),
      ).rejects.toThrow(AuthConstants.MESSAGES.INVALID_CREDENTIALS);
    });
  });

  describe("Authentication HTTP Integration Tests", () => {
    const testEmail = `http-user-${Date.now()}@gdgranchi.in`;
    const testPassword = "DevFestPassword2026";
    let authToken = "";

    it("should register participant via POST /api/v1/auth/register", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        name: "DevFest Participant",
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        mobile: "+919876543210",
        organization: "GDG Ranchi",
        city: "Ranchi",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user.email).toBe(testEmail);
      expect(response.headers["set-cookie"]).toBeDefined();

      authToken = response.body.data.token;
    });

    it("should login participant via POST /api/v1/auth/login", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
    });

    it("should fetch current user profile via GET /api/v1/auth/me", async () => {
      const response = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testEmail);
      expect(response.body.data.participant).toBeDefined();
    });

    it("should verify active session via GET /api/v1/auth/verify", async () => {
      const response = await request(app)
        .get("/api/v1/auth/verify")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    it("should change password via POST /api/v1/auth/change-password", async () => {
      const newPassword = "NewDevFestPass2027";
      const response = await request(app)
        .post("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          oldPassword: testPassword,
          newPassword,
          confirmNewPassword: newPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(AuthConstants.MESSAGES.PASSWORD_CHANGED);
    });

    it("should clear cookie via POST /api/v1/auth/logout", async () => {
      const response = await request(app).post("/api/v1/auth/logout");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return documentation reference on GET /api/v1/docs", async () => {
      const response = await request(app).get("/api/v1/docs");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("title");
      expect(response.body).toHaveProperty("reference");
      expect(response.body).toHaveProperty("modules");
    });
  });
});

import request from "supertest";
import app from "../src/app";
import { AuthUtils, authUtils } from "../src/api/v1/auth/AuthUtils";
import { AuthValidator } from "../src/api/v1/auth/Auth.validation";
import { authService } from "../src/api/v1/auth/Auth.Service";
import { AuthConstants } from "../src/api/v1/auth/auth.constants";

describe("GDG Ranchi DevFest 2026 - Authentication System", () => {
  describe("AuthUtils Unit Tests", () => {
    it("should hash and verify passwords correctly", async () => {
      const password = "SuperSecretPassword2026";
      const hash = await AuthUtils.HASH_PASSWORD(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);

      const isMatch = await AuthUtils.COMPARE_PASSWORD(password, hash);
      expect(isMatch).toBe(true);

      const isWrongMatch = await AuthUtils.COMPARE_PASSWORD("WrongPassword123", hash);
      expect(isWrongMatch).toBe(false);
    });

    it("should generate and verify JWT auth tokens", () => {
      const payload = {
        userId: "usr-test-123",
        email: "participant@gdgranchi.in",
        role: "PARTICIPANT" as const,
        participantId: "GDG26-0001",
      };

      const token = AuthUtils.GENERATE_TOKEN(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const decoded = AuthUtils.VERIFY_TOKEN(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.participantId).toBe(payload.participantId);
    });

    it("should generate properly formatted participant ID", () => {
      const id = AuthUtils.GENERATE_PARTICIPANT_ID("GDGR");
      expect(id).toMatch(/^GDGR-\d{4}$/);
    });

    it("should sanitize user objects by removing password field", () => {
      const user = {
        id: "usr-999",
        email: "test@gdgranchi.in",
        password: "secret_bcrypt_hash",
        passwordHash: "secret_bcrypt_hash",
        role: "PARTICIPANT",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const sanitized = AuthUtils.SANITIZE_USER(user);
      expect(sanitized).not.toHaveProperty("password");
      expect(sanitized).not.toHaveProperty("passwordHash");
      expect(sanitized.email).toBe("test@gdgranchi.in");
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
        mobile: "9876543210",
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
        mobile: "9876543210",
      };

      const parsed = AuthValidator.REGISTER_SCHEMA.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.errors[0].message).toContain("Passwords do not match");
      }
    });

    it("should reject short password under 8 characters", () => {
      const invalid = {
        name: "Abhishek Kumar",
        email: "abhishek@example.com",
        password: "short",
        confirmPassword: "short",
        mobile: "9876543210",
      };

      const parsed = AuthValidator.REGISTER_SCHEMA.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it("should validate login schema", () => {
      expect(
        AuthValidator.LOGIN_SCHEMA.safeParse({
          email: "valid@gdgranchi.in",
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

    it("should validate change password schema", () => {
      expect(
        AuthValidator.CHANGE_PASSWORD_SCHEMA.safeParse({
          oldPassword: "oldPassword123",
          newPassword: "newPassword1234",
          confirmNewPassword: "newPassword1234",
        }).success,
      ).toBe(true);

      expect(
        AuthValidator.CHANGE_PASSWORD_SCHEMA.safeParse({
          oldPassword: "oldPassword123",
          newPassword: "newPassword1234",
          confirmNewPassword: "mismatchedPassword",
        }).success,
      ).toBe(false);
    });
  });

  describe("AuthService Unit Tests", () => {
    it("should register a participant and allow lookup", async () => {
      const email = `test-${Date.now()}@gdgranchi.in`;
      const result = await authService.signUp({
        name: "Ranchi Coder",
        email,
        password: "Password2026",
        confirmPassword: "Password2026",
        mobile: "9988776655",
        organization: "GDG",
        city: "Ranchi",
      });

      expect(result).toHaveProperty("token");
      expect(result.user.email).toBe(email);
      expect(result.participant).toBeDefined();
      expect(result.participant?.participantId).toMatch(/^GDG26-\d{4}$/);
      expect(result.participant?.id).toBe(result.user.id);
      expect(result.participant?.userId).toBe(result.user.id);

      const foundUser = await authService.FIND_USER_BY_EMAIL(email);
      expect(foundUser).not.toBeNull();
      expect(foundUser?.email).toBe(email);
    });

    it("should reject duplicate registration for existing email", async () => {
      const email = `dupe-${Date.now()}@gdgranchi.in`;
      await authService.signUp({
        name: "First User",
        email,
        password: "Password2026",
        confirmPassword: "Password2026",
        mobile: "9988776655",
      });

      await expect(
        authService.signUp({
          name: "Second User",
          email,
          password: "Password2026",
          confirmPassword: "Password2026",
          mobile: "9988776655",
        }),
      ).rejects.toThrow(AuthConstants.MESSAGES.EMAIL_ALREADY_EXISTS);
    });

    it("should login user with correct credentials and reject invalid password", async () => {
      const email = `login-${Date.now()}@gdgranchi.in`;
      await authService.signUp({
        name: "Login User",
        email,
        password: "SecretPassword123",
        confirmPassword: "SecretPassword123",
        mobile: "9988776655",
      });

      const loginSuccess = await authService.login({
        email,
        password: "SecretPassword123",
      });

      expect(loginSuccess.token).toBeDefined();
      expect(loginSuccess.user.email).toBe(email);

      await expect(
        authService.login({
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
        mobile: "9876543210",
        organization: "GDG Ranchi",
        city: "Ranchi",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user.email).toBe(testEmail);
      expect(response.body.data.participant).toBeDefined();
      expect(response.body.data.participant.id).toBe(response.body.data.user.id);
      expect(response.body.data.participant.userId).toBe(response.body.data.user.id);
      expect(response.headers["set-cookie"]).toBeDefined();

      authToken = response.body.data.token;
    });

    it("should reject duplicate registration with 409 Conflict", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        name: "DevFest Duplicate",
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        mobile: "9876543210",
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(AuthConstants.MESSAGES.EMAIL_ALREADY_EXISTS);
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

      // Verify login with new password
      const newLogin = await request(app).post("/api/v1/auth/login").send({
        email: testEmail,
        password: newPassword,
      });
      expect(newLogin.status).toBe(200);
      expect(newLogin.body.success).toBe(true);
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

    it("should return 200 on GET /health", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("healthy");
      expect(response.body.service).toBe("GDG Ranchi DevFest 2026 Game API");
    });
  });
});

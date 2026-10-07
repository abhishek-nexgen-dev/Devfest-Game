import request from "supertest";
import app from "../src/app";
import { AuthUtils } from "../src/api/v1/auth/AuthUtils";
import { AuthValidator } from "../src/api/v1/auth/Auth.validation";
import { AuthConstants } from "../src/api/v1/auth/auth.constants";
import AuthSchema from "../src/api/v1/auth/Auth.schema";
import pg, { connectDatabase } from "../src/core/database/postgres";

describe("GDG Ranchi DevFest 2026 - Admin & Super Admin Authentication System", () => {
  beforeAll(async () => {
    await connectDatabase();
    await pg.query("DROP TABLE IF EXISTS users CASCADE;");
    await AuthSchema();
  });

  afterAll(async () => {
    try {
      await pg.query("DELETE FROM users WHERE role = 'ADMIN';");
    } catch (_err) {
      // Ignore cleanup errors
    }
    await pg.end();
  });

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
        userId: "admin-super-001",
        email: "admin@gdgranchi.in",
        role: "SUPER_ADMIN" as const,
      };

      const token = AuthUtils.GENERATE_TOKEN(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const decoded = AuthUtils.VERIFY_TOKEN(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it("should sanitize user objects by removing password fields", () => {
      const user = {
        id: "adm-123",
        name: "GDG Admin",
        email: "admin@gdgranchi.in",
        passwordHash: "$2b$10$abcdefg",
        role: "ADMIN" as const,
        status: "ACTIVE" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const sanitized = AuthUtils.SANITIZE_USER(user);
      expect(sanitized).not.toHaveProperty("password");
      expect(sanitized).not.toHaveProperty("passwordHash");
      expect(sanitized.email).toBe("admin@gdgranchi.in");
      expect(sanitized.name).toBe("GDG Admin");
    });

    it("should normalize email addresses", () => {
      expect(AuthUtils.NORMALIZE_EMAIL("  Admin.User@GDG.ORG  ")).toBe("admin.user@gdg.org");
    });
  });

  describe("AuthValidator Unit Tests", () => {
    it("should validate valid addAdmin payload", () => {
      const valid = {
        name: "Ranchi Admin",
        email: "subadmin@gdgranchi.in",
        password: "Password2026",
      };
      const parsed = AuthValidator.ADD_ADMIN_SCHEMA.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("should reject short password under 8 characters", () => {
      const invalid = {
        name: "Ranchi Admin",
        email: "subadmin@gdgranchi.in",
        password: "short",
      };
      const parsed = AuthValidator.ADD_ADMIN_SCHEMA.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it("should validate login schema", () => {
      const valid = {
        email: "admin@gdgranchi.in",
        password: "AdminPass@2026",
      };
      const parsed = AuthValidator.LOGIN_SCHEMA.safeParse(valid);
      expect(parsed.success).toBe(true);
    });

    it("should validate change password schema", () => {
      const valid = {
        oldPassword: "OldPassword123",
        newPassword: "NewPassword456",
        confirmNewPassword: "NewPassword456",
      };
      const parsed = AuthValidator.CHANGE_PASSWORD_SCHEMA.safeParse(valid);
      expect(parsed.success).toBe(true);
    });
  });

  describe("Authentication HTTP Integration Tests", () => {
    let superAdminToken = "";
    let adminToken = "";
    const adminEmail = "eventadmin@gdgranchi.in";
    const adminPassword = "AdminEvent2026";

    it("should initialize Super Admin via POST /api/v1/init-admin", async () => {
      const response = await request(app).post("/api/v1/init-admin");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(AuthConstants.MESSAGES.ADMIN_SEEDED);
      expect(response.body.data.user.role).toBe("SUPER_ADMIN");
    });

    it("should throw error if Super Admin already exists on POST /api/v1/init-admin", async () => {
      const response = await request(app).post("/api/v1/init-admin");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(AuthConstants.MESSAGES.ADMIN_ALREADY_EXISTS);
    });

    it("should login Super Admin via POST /api/v1/auth/login", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "admin@gdgranchi.in",
        password: "AdminPass@2026",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data.user.role).toBe("SUPER_ADMIN");
      expect(response.headers["set-cookie"]).toBeDefined();

      superAdminToken = response.body.data.token;
    });

    it("should allow Super Admin to add an Admin via POST /api/v1/add-admin", async () => {
      const response = await request(app)
        .post("/api/v1/add-admin")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "DevFest Admin",
          email: adminEmail,
          password: adminPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(adminEmail);
      expect(response.body.data.user.role).toBe("ADMIN");
    });

    it("should reject adding an Admin with an existing email", async () => {
      const response = await request(app)
        .post("/api/v1/add-admin")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          name: "Duplicate Admin",
          email: adminEmail,
          password: adminPassword,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(AuthConstants.MESSAGES.EMAIL_ALREADY_EXISTS);
    });

    it("should login the added Admin via POST /api/v1/auth/login", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: adminEmail,
        password: adminPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe("ADMIN");
      adminToken = response.body.data.token;
    });

    it("should forbid regular Admin from calling POST /api/v1/add-admin", async () => {
      const response = await request(app)
        .post("/api/v1/add-admin")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Unauthorized Admin",
          email: "unauth@gdgranchi.in",
          password: adminPassword,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe(AuthConstants.MESSAGES.FORBIDDEN);
    });

    it("should fetch current Admin profile via GET /api/v1/me", async () => {
      const response = await request(app)
        .get("/api/v1/me")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(adminEmail);
      expect(response.body.data.role).toBe("ADMIN");
    });

    it("should verify active session via GET /api/v1/verify", async () => {
      const response = await request(app)
        .get("/api/v1/verify")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    it("should change Admin password via POST /api/v1/change-password", async () => {
      const newPassword = "NewAdminPass2027";
      const response = await request(app)
        .post("/api/v1/change-password")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          oldPassword: adminPassword,
          newPassword,
          confirmNewPassword: newPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(AuthConstants.MESSAGES.PASSWORD_CHANGED);
    });

    it("should clear cookie via POST /api/v1/logout", async () => {
      const response = await request(app).post("/api/v1/logout");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return documentation reference on GET /api/v1/docs", async () => {
      const response = await request(app).get("/api/v1/docs");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("title");
    });

    it("should return 200 on GET /health", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("healthy");
    });
  });
});

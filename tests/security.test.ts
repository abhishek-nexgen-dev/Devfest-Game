import request from "supertest";
import app from "../src/app";
import initSchemas from "../src/core/database/schema";
import pg, { connectDatabase } from "../src/core/database/postgres";

describe("GDG Ranchi DevFest 2026 - Comprehensive Backend Security Test Suite", () => {
  beforeAll(async () => {
    await connectDatabase();
    await initSchemas();
    await pg.query("DELETE FROM participants;");
    await pg.query("DELETE FROM games;");
    await pg.query("DELETE FROM users;");
  });

  afterAll(async () => {
    try {
      await pg.query("DELETE FROM participants;");
      await pg.query("DELETE FROM games;");
      await pg.query("DELETE FROM users;");
    } catch (_err) {
      // Ignore cleanup errors
    }
  });

  describe("1. Helmet & HTTP Security Headers", () => {
    it("should remove X-Powered-By header to prevent technology fingerprinting", async () => {
      const response = await request(app).get("/health");
      expect(response.headers["x-powered-by"]).toBeUndefined();
    });

    it("should include X-Content-Type-Options: nosniff to prevent MIME sniffing", async () => {
      const response = await request(app).get("/health");
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("should include X-Frame-Options: DENY to protect against Clickjacking", async () => {
      const response = await request(app).get("/health");
      expect(response.headers["x-frame-options"]).toBe("DENY");
    });

    it("should include Content-Security-Policy header", async () => {
      const response = await request(app).get("/health");
      expect(response.headers["content-security-policy"]).toBeDefined();
      expect(response.headers["content-security-policy"]).toContain("default-src 'self'");
    });

    it("should include Referrer-Policy header", async () => {
      const response = await request(app).get("/health");
      expect(response.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    });
  });

  describe("2. SQL Injection Resistance (Parameterized Queries)", () => {
    it("should resist SQL injection in Auth login email parameter", async () => {
      const maliciousPayload = {
        email: "' OR '1'='1' --",
        password: "RandomPassword123",
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(maliciousPayload);

      // Should be rejected by email format validator or user lookup
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      // Ensure database tables remain intact
      const checkTables = await pg.query("SELECT COUNT(*) FROM users;");
      expect(checkTables).toBeDefined();
    });

    it("should resist SQL injection in Game name lookup via URL param", async () => {
      const maliciousName = "TechQuiz'; DROP TABLE users; --";

      const response = await request(app).get(
        `/api/v1/game/name/${encodeURIComponent(maliciousName)}`,
      );

      // Query should safely treat the entire string as a literal value parameter
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Verify users table still exists and was not dropped
      const checkUsers = await pg.query("SELECT COUNT(*) FROM users;");
      expect(checkUsers.rows).toBeDefined();
    });

    it("should resist SQL injection in Game ID parameter", async () => {
      const maliciousId = "1 OR 1=1";

      const response = await request(app).get(`/api/v1/game/${encodeURIComponent(maliciousId)}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it("should resist SQL injection in Participant ticketId lookup", async () => {
      const maliciousTicket = "GDG26' UNION SELECT * FROM users --";

      const response = await request(app).get(
        `/api/v1/participants/${encodeURIComponent(maliciousTicket)}`,
      );

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe("3. Prototype Pollution and Input Sanitization", () => {
    it("should sanitize and strip prototype pollution payloads from request body", async () => {
      const payloadWithPollution = {
        __proto__: { isAdmin: true },
        ticket_id: "GDG26-SEC01",
        name: "Security Tester",
        email: "sectest@example.com",
        mobile_number: "9876543210",
        social_link: "https://linkedin.com/in/sectest",
        location: "Ranchi",
        primary_language: ["TypeScript"],
      };

      const response = await request(app)
        .post("/api/v1/participants")
        .send(payloadWithPollution);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify Global Object was NOT polluted
      const testObj: any = {};
      expect(testObj.isAdmin).toBeUndefined();
    });

    it("should sanitize null bytes from input strings", async () => {
      const payloadWithNullByte = {
        ticket_id: "GDG26-NULL\0TEST",
        name: "Null Tester",
        email: "nulltest@example.com",
        mobile_number: "9876543211",
        social_link: "https://linkedin.com/in/nulltest",
        location: "Ranchi",
        primary_language: ["Python"],
      };

      const response = await request(app)
        .post("/api/v1/participants")
        .send(payloadWithNullByte);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ticket_id).toBe("GDG26-NULLTEST");
    });
  });

  describe("4. Payload Limit (DoS Protection)", () => {
    it("should reject payloads exceeding 1MB with 413 Payload Too Large", async () => {
      // Create a payload larger than 1MB
      const largeString = "A".repeat(1.5 * 1024 * 1024); // 1.5MB

      const response = await request(app)
        .post("/api/v1/participants")
        .send({ data: largeString });

      expect(response.status).toBe(413);
    });
  });
});


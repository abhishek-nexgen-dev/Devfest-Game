import request from "supertest";
import app from "../src/app";
import initSchemas from "../src/core/database/schema";
import pg, { connectDatabase } from "../src/core/database/postgres";

describe("GDG Ranchi DevFest 2026 - Game Module Integration Tests", () => {
  let superAdminToken: string;
  let adminToken: string;
  let createdGameId: number;

  beforeAll(async () => {
    await connectDatabase();
    await initSchemas();

    // Clean up test tables
    await pg.query("DELETE FROM games;");
    await pg.query("DELETE FROM users;");

    // 1. Initialize Super Admin via real endpoint
    await request(app).post("/api/v1/init-admin");

    // 2. Login Super Admin to get real JWT
    const superLogin = await request(app).post("/api/v1/auth/login").send({
      email: "admin@gdgranchi.in",
      password: "AdminPass@2026",
    });
    superAdminToken = superLogin.body.data.token;

    // 3. Super Admin creates regular Admin
    await request(app)
      .post("/api/v1/add-admin")
      .set("Authorization", `Bearer ${superAdminToken}`)
      .send({
        name: "Event Admin",
        email: "eventadmin@gdgranchi.in",
        password: "AdminEventPass2026",
      });

    // 4. Regular Admin logs in
    const adminLogin = await request(app).post("/api/v1/auth/login").send({
      email: "eventadmin@gdgranchi.in",
      password: "AdminEventPass2026",
    });
    adminToken = adminLogin.body.data.token;
  });

  afterAll(async () => {
    try {
      await pg.query("DELETE FROM games;");
      await pg.query("DELETE FROM users;");
    } catch (_err) {
      // Ignore cleanup error
    }
  });

  describe("POST /api/v1/game/create (and /api/v1/games)", () => {
    it("should reject creation without auth token", async () => {
      const response = await request(app)
        .post("/api/v1/game/create")
        .send({
          game_name: "Web3 Treasure Hunt",
          start_time: new Date(Date.now() + 3600000).toISOString(),
          end_time: new Date(Date.now() + 7200000).toISOString(),
        });

      expect(response.status).toBe(500);
      expect(response.body.status).toBe(false);
    });

    it("should reject creation when end_time is before start_time", async () => {
      const response = await request(app)
        .post("/api/v1/game/create")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          game_name: "Invalid Time Game",
          start_time: "2026-11-15T12:00:00.000Z",
          end_time: "2026-11-15T10:00:00.000Z",
        });

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("End time must be after start time");
    });

    it("should reject creation with empty game_name", async () => {
      const response = await request(app)
        .post("/api/v1/game/create")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          game_name: "",
          start_time: "2026-11-15T10:00:00.000Z",
          end_time: "2026-11-15T12:00:00.000Z",
        });

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("at least 2 characters");
    });

    it("should successfully create a new game with Super Admin", async () => {
      const response = await request(app)
        .post("/api/v1/game/create")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          game_name: "AI Prompt Battle",
          description: "Generate best prompts to defeat AI challenges",
          max_score: 150,
          registrations: 0,
          submissions: 0,
          start_time: "2026-11-15T10:00:00.000Z",
          end_time: "2026-11-15T13:00:00.000Z",
          status: "UPCOMING",
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.game_name).toBe("AI Prompt Battle");
      expect(response.body.data.max_score).toBe(150);
      expect(response.body.data.status).toBe("UPCOMING");
      createdGameId = Number(response.body.data.id);
      expect(createdGameId).toBeGreaterThan(0);
    });

    it("should reject creating duplicate game with the same name", async () => {
      const response = await request(app)
        .post("/api/v1/game/create")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          game_name: "AI Prompt Battle",
          start_time: "2026-11-15T10:00:00.000Z",
          end_time: "2026-11-15T13:00:00.000Z",
        });

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("already exists");
    });

    it("should successfully create another game with Admin token via /api/v1/games", async () => {
      const response = await request(app)
        .post("/api/v1/games")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          game_name: "Bug Hunt Challenge",
          description: "Find and fix bugs in open source repos",
          max_score: 200,
          start_time: "2026-11-16T09:00:00.000Z",
          end_time: "2026-11-16T12:00:00.000Z",
          status: "UPCOMING",
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.data.game_name).toBe("Bug Hunt Challenge");
    });
  });

  describe("GET /api/v1/game/get (and /api/v1/games)", () => {
    it("should fetch all games without authentication via /api/v1/game/get", async () => {
      const response = await request(app).get("/api/v1/game/get");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it("should fetch all games without authentication via /api/v1/games", async () => {
      const response = await request(app).get("/api/v1/games");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe("GET /api/v1/game/:id (and /api/v1/games/:id)", () => {
    it("should fetch a single game by ID without authentication", async () => {
      const response = await request(app).get(`/api/v1/game/${createdGameId}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.data.id).toBe(String(createdGameId));
      expect(response.body.data.game_name).toBe("AI Prompt Battle");
    });

    it("should return error when game ID does not exist", async () => {
      const response = await request(app).get("/api/v1/game/999999");

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("not found");
    });

    it("should return error when game ID is invalid string", async () => {
      const response = await request(app).get("/api/v1/game/invalid-id");

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("Valid Game ID is required");
    });
  });

  describe("PATCH / PUT /api/v1/game/:id (and /api/v1/games/:id)", () => {
    it("should reject update without auth token", async () => {
      const response = await request(app)
        .patch(`/api/v1/game/${createdGameId}`)
        .send({ status: "ACTIVE" });

      expect(response.body.status).toBe(false);
    });

    it("should successfully update game status and max_score with Admin token", async () => {
      const response = await request(app)
        .patch(`/api/v1/game/${createdGameId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "ACTIVE",
          max_score: 250,
          registrations: 35,
          submissions: 10,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.data.status).toBe("ACTIVE");
      expect(response.body.data.max_score).toBe(250);
      expect(response.body.data.registrations).toBe(35);
      expect(response.body.data.submissions).toBe(10);
    });

    it("should reject update with invalid time range", async () => {
      const response = await request(app)
        .patch(`/api/v1/game/${createdGameId}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          end_time: "2026-11-15T08:00:00.000Z", // before start_time (10:00:00)
        });

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("End time must be after start time");
    });

    it("should reject renaming to another existing game name", async () => {
      const response = await request(app)
        .patch(`/api/v1/game/${createdGameId}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          game_name: "Bug Hunt Challenge",
        });

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("already exists");
    });

    it("should support PUT via /api/v1/games/:id", async () => {
      const response = await request(app)
        .put(`/api/v1/games/${createdGameId}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          status: "CLOSED",
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.data.status).toBe("CLOSED");
    });

    it("should return error when updating non-existent game ID", async () => {
      const response = await request(app)
        .patch("/api/v1/game/888888")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({ status: "ACTIVE" });

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("Game Activation, Closing & Name Lookup", () => {
    it("should fetch a game by name via /api/v1/game/name/:name", async () => {
      const response = await request(app).get("/api/v1/game/name/AI%20Prompt%20Battle");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.data.game_name).toBe("AI Prompt Battle");
    });

    it("should fetch game by ID via alias /api/v1/game/get/:id", async () => {
      const response = await request(app).get(`/api/v1/game/get/${createdGameId}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.data.id).toBe(String(createdGameId));
    });

    it("should activate game via PATCH /api/v1/game/:id/activate", async () => {
      const response = await request(app)
        .patch(`/api/v1/game/${createdGameId}/activate`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.data.status).toBe("ACTIVE");
      expect(response.body.message).toContain("activated");
    });

    it("should close game via PATCH /api/v1/game/:id/close", async () => {
      const response = await request(app)
        .patch(`/api/v1/game/${createdGameId}/close`)
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.data.status).toBe("CLOSED");
      expect(response.body.message).toContain("closed");
    });
  });
});

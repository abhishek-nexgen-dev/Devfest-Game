import request from "supertest";
import app from "../src/app";
import initSchemas from "../src/core/database/schema";
import pg, { connectDatabase } from "../src/core/database/postgres";

describe("GDG Ranchi DevFest 2026 - Participant Module & Track Integration Tests", () => {
  let superAdminToken: string;
  let adminToken: string;
  let testGameId: number;

  const testParticipant1 = {
    ticket_id: "GDG26-PART-001",
    name: "Aman Sharma",
    email: "aman.sharma@gdgranchi.in",
    mobile_number: "9876543210",
    social_link: "https://linkedin.com/in/amansharma",
    location: "Ranchi",
    track: "Web & Cloud",
    github_url: "https://github.com/amansharma",
    primary_language: ["TypeScript", "Go"],
  };

  const testParticipant2 = {
    ticket_id: "GDG26-PART-002",
    name: "Pooja Kumari",
    email: "pooja.kumari@gdgranchi.in",
    mobile_number: "9123456780",
    social_link: "https://x.com/poojadev",
    location: "Jamshedpur",
    // No track provided — should default cleanly to null
    primary_language: ["Python", "Rust"],
  };

  beforeAll(async () => {
    await connectDatabase();
    await initSchemas();

    // Clean up test tables
    await pg.query("DELETE FROM participants;");
    await pg.query("DELETE FROM games;");
    await pg.query("DELETE FROM users;");

    // 1. Initialize Super Admin
    await request(app).post("/api/v1/init-admin");

    // 2. Login Super Admin to get token
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
        name: "Participant Admin",
        email: "partadmin@gdgranchi.in",
        password: "AdminPartPass2026",
      });

    // 4. Regular Admin logs in
    const adminLogin = await request(app).post("/api/v1/auth/login").send({
      email: "partadmin@gdgranchi.in",
      password: "AdminPartPass2026",
    });
    adminToken = adminLogin.body.data.token;

    // 5. Create a test game for participation
    const gameRes = await request(app)
      .post("/api/v1/game/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        game_name: "DevFest Cloud Challenge",
        description: "Solve cloud deployment puzzles",
        max_score: 100,
        start_time: new Date(Date.now() + 60000).toISOString(),
        end_time: new Date(Date.now() + 86400000).toISOString(),
      });
    testGameId = Number(gameRes.body.data.id);
  });

  afterAll(async () => {
    try {
      await pg.query("DELETE FROM participants;");
      await pg.query("DELETE FROM games;");
      await pg.query("DELETE FROM users;");
    } catch (_err) {
      // Ignore cleanup error
    }
  });

  describe("1. Participant Registration with Track Field", () => {
    it("should successfully register a new participant with track field via POST /api/v1/participant/create", async () => {
      const response = await request(app)
        .post("/api/v1/participant/create")
        .send(testParticipant1);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ticket_id).toBe(testParticipant1.ticket_id);
      expect(response.body.data.name).toBe(testParticipant1.name);
      expect(response.body.data.track).toBe("Web & Cloud");
      expect(response.body.data.total_points).toBe(0);
      expect(response.body.data.is_certificate_claim).toBe(false);

      // Verify persistence in PostgreSQL
      const dbCheck = await pg.query(
        "SELECT track FROM participants WHERE ticket_id = $1",
        [testParticipant1.ticket_id],
      );
      expect(dbCheck.rows[0].track).toBe("Web & Cloud");
    });

    it("should register participant without track and store null via alias POST /api/v1/participants", async () => {
      const response = await request(app)
        .post("/api/v1/participants")
        .send(testParticipant2);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ticket_id).toBe(testParticipant2.ticket_id);
      expect(response.body.data.track).toBeNull();
    });

    it("should reject registration with duplicate ticket_id", async () => {
      const response = await request(app)
        .post("/api/v1/participant/create")
        .send(testParticipant1);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("ticket ID already exists");
    });

    it("should reject registration when track exceeds 100 characters", async () => {
      const longTrackPayload = {
        ...testParticipant1,
        ticket_id: "GDG26-LONG-TRACK",
        email: "longtrack@gdgranchi.in",
        track: "A".repeat(101),
      };

      const response = await request(app)
        .post("/api/v1/participant/create")
        .send(longTrackPayload);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Track must not exceed 100 characters");
    });

    it("should reject registration when required fields are missing", async () => {
      const invalidPayload = {
        name: "Incomplete User",
      };

      const response = await request(app)
        .post("/api/v1/participant/create")
        .send(invalidPayload);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe("2. Participant Retrieval (Public Endpoints)", () => {
    it("should fetch all participants including track field via GET /api/v1/participants/get", async () => {
      const response = await request(app).get("/api/v1/participants/get");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);

      const foundP1 = response.body.data.find(
        (p: any) => p.ticket_id === testParticipant1.ticket_id,
      );
      expect(foundP1).toBeDefined();
      expect(foundP1.track).toBe("Web & Cloud");
    });

    it("should fetch single participant by ticket_id including track via GET /api/v1/participant/:ticketId", async () => {
      const response = await request(app).get(
        `/api/v1/participant/${testParticipant1.ticket_id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ticket_id).toBe(testParticipant1.ticket_id);
      expect(response.body.data.name).toBe(testParticipant1.name);
      expect(response.body.data.track).toBe("Web & Cloud");
      expect(response.body.data.location).toBe(testParticipant1.location);
    });

    it("should return error for non-existent ticket ID", async () => {
      const response = await request(app).get("/api/v1/participant/NON-EXISTENT-999");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Participant record not found");
    });
  });

  describe("3. Public Join Game Flow", () => {
    it("should allow participant to join a game with email, ticket_id, game_id via POST /api/v1/participant/join-game", async () => {
      const response = await request(app)
        .post("/api/v1/participant/join-game")
        .send({
          email: testParticipant1.email,
          ticket_id: testParticipant1.ticket_id,
          game_id: testGameId,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("joined game successfully");

      const games = response.body.data.games;
      expect(games).toHaveLength(1);
      expect(games[0].game_id).toBe(testGameId);
      expect(games[0].game_name).toBe("DevFest Cloud Challenge");
      expect(games[0].Total_game_point).toBe(0);
      expect(games[0].isCompleted).toBe(false);
    });

    it("should reject join game if participant already joined", async () => {
      const response = await request(app)
        .post("/api/v1/participant/join-game")
        .send({
          email: testParticipant1.email,
          ticket_id: testParticipant1.ticket_id,
          game_id: testGameId,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already joined this game");
    });

    it("should reject join game if email does not match ticket owner", async () => {
      const response = await request(app)
        .post("/api/v1/participant/join-game")
        .send({
          email: "imposter@gdgranchi.in",
          ticket_id: testParticipant1.ticket_id,
          game_id: testGameId,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("does not match this ticket ID");
    });

    it("should reject join game if game_id does not exist", async () => {
      const response = await request(app)
        .post("/api/v1/participant/join-game")
        .send({
          email: testParticipant2.email,
          ticket_id: testParticipant2.ticket_id,
          game_id: 888888,
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Game with ID 888888 does not exist");
    });
  });

  describe("4. Admin Profile & Track Update", () => {
    it("should update participant track and profile via PUT /api/v1/participant/:ticketId with Admin token", async () => {
      const response = await request(app)
        .put(`/api/v1/participant/${testParticipant1.ticket_id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          track: "AI & Machine Learning",
          location: "Bokaro",
          is_certificate_claim: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.track).toBe("AI & Machine Learning");
      expect(response.body.data.location).toBe("Bokaro");
      expect(response.body.data.is_certificate_claim).toBe(true);

      // Verify in database
      const dbCheck = await pg.query(
        "SELECT track, location, is_certificate_claim FROM participants WHERE ticket_id = $1",
        [testParticipant1.ticket_id],
      );
      expect(dbCheck.rows[0].track).toBe("AI & Machine Learning");
      expect(dbCheck.rows[0].location).toBe("Bokaro");
      expect(dbCheck.rows[0].is_certificate_claim).toBe(true);
    });

    it("should update participant track from null to a valid track with Super Admin token", async () => {
      const response = await request(app)
        .put(`/api/v1/participant/${testParticipant2.ticket_id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          track: "Mobile & Flutter",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.track).toBe("Mobile & Flutter");
    });
  });

  describe("5. Admin Game Score Update & Total Points Sync", () => {
    it("should update participant game score and auto-recalculate total_points via PATCH /api/v1/participants/update/game-score", async () => {
      const response = await request(app)
        .patch(
          `/api/v1/participants/update/game-score?ticket_id=${testParticipant1.ticket_id}&game_id=${testGameId}`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          score: 95,
          isCompleted: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total_points).toBe(95);

      const gameItem = response.body.data.games.find(
        (g: any) => Number(g.game_id) === testGameId,
      );
      expect(gameItem).toBeDefined();
      expect(gameItem.Total_game_point).toBe(95);
      expect(gameItem.isCompleted).toBe(true);
    });

    it("should reject score exceeding game max_score", async () => {
      const response = await request(app)
        .patch(
          `/api/v1/participants/update/game-score?ticket_id=${testParticipant1.ticket_id}&game_id=${testGameId}`,
        )
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          score: 150, // max_score is 100
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("cannot exceed maximum allowed score");
    });
  });
});

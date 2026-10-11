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
    await pg.query("DELETE FROM participants;");
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
      await pg.query("DELETE FROM participants;");
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

  describe("Public Participant Game Join (POST / PUT / PATCH /api/v1/participants/:ticketId)", () => {
    const testTicketId = "GDG26-PJOIN01";
    const testEmail = "joinparticipant@gdgranchi.in";
    let joinTestGameId: number;
    let game4Id: number;

    beforeAll(async () => {
      // 1. Create a game for participant to join
      const gameRes = await request(app)
        .post("/api/v1/game/create")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          game_name: "Code Combat Challenge",
          start_time: new Date(Date.now() + 60000).toISOString(),
          end_time: new Date(Date.now() + 86400000).toISOString(),
          max_score: 100,
        });
      joinTestGameId = Number(gameRes.body.data.id);

      // 2. Register a public participant
      await request(app)
        .post("/api/v1/participants")
        .send({
          ticket_id: testTicketId,
          name: "Join Game Tester",
          email: testEmail,
          mobile_number: "9988776655",
          social_link: "https://twitter.com/jointester",
          location: "Ranchi",
          primary_language: ["TypeScript", "Python"],
        });
    });

    it("should allow public participant to join game with only game_id (game_name auto-populated, is_completed defaults to false, points defaults to 0)", async () => {
      const response = await request(app)
        .post(`/api/v1/participants/${testTicketId}`)
        .send({
          email: testEmail,
          ticket_id: testTicketId,
          games: [
            {
              game_id: joinTestGameId,
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.message).toContain("joined game successfully");
      expect(response.body.data.ticket_id).toBe(testTicketId);

      const games = response.body.data.games;
      expect(games).toHaveLength(1);
      expect(games[0].game_id).toBe(joinTestGameId);
      expect(games[0].game_name).toBe("Code Combat Challenge"); // Looked up by game_id!
      expect(games[0].is_completed).toBe(false); // Defaults to false!
      expect(games[0].points).toBe(0); // Defaults to 0!
      expect(response.body.data.total_points).toBe(0);
    });

    it("should reject public join game if email does not match ticketId", async () => {
      const response = await request(app)
        .post(`/api/v1/participants/${testTicketId}`)
        .send({
          email: "wrongemail@other.com",
          ticket_id: testTicketId,
          games: [
            {
              game_id: joinTestGameId,
              is_completed: true,
            },
          ],
        });

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("does not match");
    });

    it("should reject public join game if email is missing", async () => {
      const response = await request(app)
        .post(`/api/v1/participants/${testTicketId}`)
        .send({
          ticket_id: testTicketId,
          games: [
            {
              game_id: joinTestGameId,
              is_completed: true,
            },
          ],
        });

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("Email is required");
    });

    it("should reject public join game if game_id does not exist", async () => {
      const response = await request(app)
        .post(`/api/v1/participants/${testTicketId}`)
        .send({
          email: testEmail,
          ticket_id: testTicketId,
          games: [
            {
              game_id: 999999,
              is_completed: true,
            },
          ],
        });

      expect(response.body.status).toBe(false);
      expect(response.body.message).toMatch(/(does not exist|Foreign key violation)/i);
    });

    it("should allow public participant to join another game via PUT /api/v1/participants/:ticketId (merging games)", async () => {
      // Create a 2nd game
      const game2Res = await request(app)
        .post("/api/v1/game/create")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          game_name: "Web3 Cipher Maze",
          start_time: new Date(Date.now() + 60000).toISOString(),
          end_time: new Date(Date.now() + 86400000).toISOString(),
          max_score: 50,
        });
      const game2Id = Number(game2Res.body.data.id);

      const response = await request(app)
        .put(`/api/v1/participants/${testTicketId}`)
        .send({
          email: testEmail,
          games: [
            {
              game_id: game2Id,
              is_completed: false,
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);

      const games = response.body.data.games;
      expect(games).toHaveLength(2); // Both games merged!
      const g2 = games.find((g: any) => g.game_id === game2Id);
      expect(g2).toBeDefined();
      expect(g2.game_name).toBe("Web3 Cipher Maze");
      expect(g2.points).toBe(0); // Default points 0
      expect(g2.is_completed).toBe(false);
    });

    it("should allow public participant to join/update game via PATCH /api/v1/participants/:ticketId", async () => {
      const response = await request(app)
        .patch(`/api/v1/participants/${testTicketId}`)
        .send({
          email: testEmail,
          games: [
            {
              game_id: joinTestGameId,
              is_completed: true,
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
    });

    it("should allow public participant to join game using flat body { email, ticket_id, game_id } on POST /api/v1/participants/join-game", async () => {
      // Create game 3 for fresh join
      const game3Res = await request(app)
        .post("/api/v1/game/create")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          game_name: "Code Sprint Blitz",
          start_time: new Date(Date.now() + 60000).toISOString(),
          end_time: new Date(Date.now() + 86400000).toISOString(),
          max_score: 80,
        });
      const game3Id = Number(game3Res.body.data.id);

      const response = await request(app)
        .post("/api/v1/participants/join-game")
        .send({
          email: testEmail,
          ticket_id: testTicketId,
          game_id: game3Id,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.message).toContain("joined game successfully");
      expect(response.body.data.ticket_id).toBe(testTicketId);

      const games = response.body.data.games;
      const targetGame = games.find((g: any) => g.game_id === game3Id);
      expect(targetGame).toBeDefined();
      expect(targetGame.game_name).toBe("Code Sprint Blitz");
      expect(targetGame.Total_game_point).toBe(0);
      expect(targetGame.isCompleted).toBe(false);
      expect(targetGame.is_completed).toBe(false);
      expect(targetGame.point).toBe(0);
      expect(targetGame.points).toBe(0);
    });

    it("should reject join game if participant has already joined the game", async () => {
      const response = await request(app)
        .post("/api/v1/participants/join-game")
        .send({
          email: testEmail,
          ticket_id: testTicketId,
          game_id: joinTestGameId,
        });

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("You can't join game");
      expect(response.body.message).toContain("already joined this game");
    });

    it("should allow public participant to join game using flat body { email, ticket_id, game_id } on POST /api/v1/participant/join-game", async () => {
      // Create game 4 for fresh join on singular alias
      const game4Res = await request(app)
        .post("/api/v1/game/create")
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          game_name: "Algorithm Arena",
          start_time: new Date(Date.now() + 60000).toISOString(),
          end_time: new Date(Date.now() + 86400000).toISOString(),
          max_score: 90,
        });
      game4Id = Number(game4Res.body.data.id);

      const response = await request(app)
        .post("/api/v1/participant/join-game")
        .send({
          email: testEmail,
          ticket_id: testTicketId,
          game_id: game4Id,
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(true);
      expect(response.body.message).toContain("joined game successfully");
    });

    it("should update all game fields including name and sync participant games", async () => {
      const updateRes = await request(app)
        .patch(`/api/v1/game/${game4Id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          game_name: "Algorithm Arena Championship",
          description: "Advanced algorithmic showdown",
          max_score: 300,
          registrations: 42,
          submissions: 15,
          start_time: "2026-11-20T10:00:00.000Z",
          end_time: "2026-11-20T16:00:00.000Z",
          status: "ACTIVE",
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe(true);
      expect(updateRes.body.data.game_name).toBe("Algorithm Arena Championship");
      expect(updateRes.body.data.description).toBe("Advanced algorithmic showdown");
      expect(updateRes.body.data.max_score).toBe(300);
      expect(updateRes.body.data.registrations).toBe(42);
      expect(updateRes.body.data.submissions).toBe(15);
      expect(updateRes.body.data.status).toBe("ACTIVE");

      // Verify participant's games array reflects the new game name
      const participantRes = await request(app).get(`/api/v1/participants/${testTicketId}`);
      expect(participantRes.status).toBe(200);
      const participantGames = participantRes.body.data.games;
      const syncedGame = participantGames.find((g: any) => Number(g.game_id) === game4Id);
      expect(syncedGame).toBeDefined();
      expect(syncedGame.game_name).toBe("Algorithm Arena Championship");
    });

    it("should reject flat join game if participant does not exist", async () => {
      const response = await request(app)
        .post("/api/v1/participants/join-game")
        .send({
          email: "unknown@example.com",
          ticket_id: "NON-EXISTENT-TICKET",
          game_id: joinTestGameId,
        });

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("Participant not found");
      expect(response.body.message).toContain("You can't join game");
    });

    it("should reject join game if email does not match ticket ID", async () => {
      const response = await request(app)
        .post("/api/v1/participants/join-game")
        .send({
          email: "wrongemail@example.com",
          ticket_id: testTicketId,
          game_id: joinTestGameId,
        });

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("You can't join game");
      expect(response.body.message).toContain("Provided email does not match this ticket ID");
    });

    it("should reject join game if game_id does not exist", async () => {
      const response = await request(app)
        .post("/api/v1/participants/join-game")
        .send({
          email: testEmail,
          ticket_id: testTicketId,
          game_id: 999999,
        });

      expect(response.body.status).toBe(false);
      expect(response.body.message).toContain("You can't join game");
      expect(response.body.message).toContain("Game with ID 999999 does not exist");
    });
  });
});

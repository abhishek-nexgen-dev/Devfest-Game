import request from "supertest";
import app from "../src/app";
import { connectDB, disconnectDB } from "../src/core/database/db.config";
import { describe, beforeAll, afterAll, expect, it } from "@jest/globals";

describe("GDG Ranchi DevFest 2026 Game Management System (Firestore Enterprise)", () => {
  let adminToken = "";
  let participant1Token = "";
  let participant2Token = "";
  let participant1Id = "";
  let participant2Id = "";
  let activeGameId = "";
  let resultId = "";
  let certHash = "";

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe("Authentication & Super Admin Seed", () => {
    it("should login with seeded Super Admin credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "admin@gdgranchi.in",
        password: "AdminPass@2026",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe("SUPER_ADMIN");
      expect(res.body.data.token).toBeDefined();
      adminToken = res.body.data.token;
    });

    it("should self-register Participant 1 and generate unique Participant ID", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Abhishek Kumar",
        email: "abhishek@devfest.in",
        password: "Password@123",
        confirmPassword: "Password@123",
        mobile: "9876543210",
        organization: "GDG Ranchi",
        city: "Ranchi",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.participant).toBeDefined();
      expect(res.body.data.participant.participantId).toMatch(/^GDG26-\d{4}$/);
      expect(res.body.data.participant.totalPoints).toBe(0);
      participant1Id = res.body.data.participant.participantId;
      participant1Token = res.body.data.token;
    });

    it("should prevent duplicate participant registration with same email", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Abhishek Duplicate",
        email: "abhishek@devfest.in",
        password: "Password@123",
        confirmPassword: "Password@123",
        mobile: "9876543211",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should self-register Participant 2 with sequential Participant ID", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Priya Sharma",
        email: "priya@devfest.in",
        password: "Password@123",
        confirmPassword: "Password@123",
        mobile: "9876543212",
        organization: "Tech Corp",
        city: "Ranchi",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.participant.participantId).toMatch(/^GDG26-\d{4}$/);
      expect(res.body.data.participant.participantId).not.toBe(participant1Id);
      participant2Id = res.body.data.participant.participantId;
      participant2Token = res.body.data.token;
    });

    it("should fetch current user profile via GET /api/v1/auth/me", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("abhishek@devfest.in");
      expect(res.body.data.participant.name).toBe("Abhishek Kumar");
    });

    it("should allow changing account password via POST /api/v1/auth/change-password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${participant2Token}`)
        .send({
          currentPassword: "Password@123",
          newPassword: "NewSecretPassword@456",
          confirmNewPassword: "NewSecretPassword@456",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify can login with new password
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "priya@devfest.in",
        password: "NewSecretPassword@456",
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.token).toBeDefined();
      participant2Token = loginRes.body.data.token;
    });

    it("should handle user logout via POST /api/v1/auth/logout", async () => {
      const res = await request(app)
        .post("/api/v1/auth/logout")
        .set("Authorization", `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers["set-cookie"]).toBeDefined();
    });
  });

  describe("Games Management", () => {
    it("should list available games catalog", async () => {
      const res = await request(app).get("/api/v1/games");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const activeGame = res.body.data.find((g: any) => g.status === "ACTIVE");
      expect(activeGame).toBeDefined();
      activeGameId = activeGame.id;
    });

    it("should allow Super Admin to create a new game", async () => {
      const res = await request(app)
        .post("/api/v1/games")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Speed Debugging Marathon",
          description: "Find and fix 5 intentional bugs in 15 minutes.",
          gameType: "INDIVIDUAL",
          status: "ACTIVE",
          maxScore: 100,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Speed Debugging Marathon");
      expect(res.body.data.maxScore).toBe(100);
    });

    it("should block non-admin from creating games", async () => {
      const res = await request(app)
        .post("/api/v1/games")
        .set("Authorization", `Bearer ${participant1Token}`)
        .send({
          title: "Unauthorized Game",
          maxScore: 100,
        });

      expect(res.status).toBe(403);
    });
  });

  describe("Game Registration & Duplicate Protection", () => {
    it("should register participant for active game", async () => {
      const res = await request(app)
        .post(`/api/v1/games/${activeGameId}/register`)
        .set("Authorization", `Bearer ${participant1Token}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.registration.gameId).toBe(activeGameId);
    });

    it("should block duplicate registration for same game", async () => {
      const res = await request(app)
        .post(`/api/v1/games/${activeGameId}/register`)
        .set("Authorization", `Bearer ${participant1Token}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("already registered");
    });

    it("should list registered games under GET /api/v1/my-games", async () => {
      const res = await request(app)
        .get("/api/v1/my-games")
        .set("Authorization", `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((r: any) => r.gameId === activeGameId)).toBe(true);
    });
  });

  describe("Game Submission & Initial Score Policy", () => {
    it("should reject submission if participant not registered", async () => {
      const res = await request(app)
        .post(`/api/v1/games/${activeGameId}/submit`)
        .set("Authorization", `Bearer ${participant2Token}`)
        .send({ submissionData: "code solution" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("register for this game");
    });

    it("should allow registered participant to submit with default score = 0", async () => {
      const res = await request(app)
        .post(`/api/v1/games/${activeGameId}/submit`)
        .set("Authorization", `Bearer ${participant1Token}`)
        .send({ submissionData: "https://github.com/gdg/solution" });

      expect(res.status).toBe(201);
      expect(res.body.data.submission.status).toBe("SUBMITTED");
      expect(res.body.data.result.score).toBe(0);
      expect(res.body.data.result.points).toBe(0);
      expect(res.body.data.result.verified).toBe(false);
      resultId = res.body.data.result.id;
    });

    it("should reject duplicate submission for the same game", async () => {
      const res = await request(app)
        .post(`/api/v1/games/${activeGameId}/submit`)
        .set("Authorization", `Bearer ${participant1Token}`)
        .send({ submissionData: "second attempt" });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain("already submitted");
    });
  });

  describe("Score Management & Validation", () => {
    it("should block participant from updating their own score", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/results/${resultId}/score`)
        .set("Authorization", `Bearer ${participant1Token}`)
        .send({ score: 100 });

      expect(res.status).toBe(403);
    });

    it("should reject score greater than game maxScore", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/results/${resultId}/score`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ score: 150 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Score cannot be less than 0 or greater than");
    });

    it("should reject negative score", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/results/${resultId}/score`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ score: -10 });

      expect(res.status).toBe(400);
    });

    it("should allow Super Admin to evaluate and update score & points", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/results/${resultId}/score`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          score: 85,
          points: 85,
          reason: "Manual evaluation: Excellent algorithm accuracy",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.result.score).toBe(85);
      expect(res.body.data.result.points).toBe(85);
      expect(res.body.data.result.verified).toBe(true);
      expect(res.body.data.scoreLog).toBeDefined();
    });

    it("should reflect updated total points in participant profile", async () => {
      const res = await request(app)
        .get("/api/v1/participants/me")
        .set("Authorization", `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.profile.totalPoints).toBe(85);
      expect(res.body.data.stats.totalPoints).toBe(85);
    });
  });

  describe("Leaderboards & Top 3 Podium", () => {
    it("should display participant ranked on the individual leaderboard", async () => {
      const res = await request(app).get("/api/v1/leaderboard");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      const top = res.body.data[0];
      expect(top.rank).toBe(1);
      expect(top.badge).toContain("Winner");
      expect(top.totalPoints).toBe(85);
    });

    it("should return Top 3 podium winners", async () => {
      const res = await request(app).get("/api/v1/leaderboard/top3");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(3);
    });
  });

  describe("Team Collaboration & Team Leaderboard", () => {
    let teamCode = "";

    it("should allow participant to create a team", async () => {
      const res = await request(app)
        .post("/api/v1/teams/create")
        .set("Authorization", `Bearer ${participant1Token}`)
        .send({ teamName: "Ranchi Code Hackers" });

      expect(res.status).toBe(201);
      expect(res.body.data.teamName).toBe("Ranchi Code Hackers");
      expect(res.body.data.teamCode).toMatch(/^GDG-\d{4}$/);
      teamCode = res.body.data.teamCode;
    });

    it("should allow second participant to join team with teamCode", async () => {
      const res = await request(app)
        .post("/api/v1/teams/join")
        .set("Authorization", `Bearer ${participant2Token}`)
        .send({ teamCode });

      expect(res.status).toBe(200);
      expect(res.body.data.memberIds.length).toBe(2);
    });

    it("should return team details on GET /api/v1/teams/me", async () => {
      const res = await request(app)
        .get("/api/v1/teams/me")
        .set("Authorization", `Bearer ${participant1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.teamName).toBe("Ranchi Code Hackers");
      expect(res.body.data.members.length).toBe(2);
    });

    it("should return team leaderboard", async () => {
      const res = await request(app).get("/api/v1/leaderboard/teams");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("Certificates", () => {
    it("should allow Super Admin to issue verifiable certificate", async () => {
      const res = await request(app)
        .post("/api/v1/certificates/admin/issue")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ participantId: participant1Id });

      expect(res.status).toBe(201);
      expect(res.body.data.certificateNo).toMatch(/^GDG26-CERT-\d{4}$/);
      expect(res.body.data.verificationHash).toBeDefined();
      certHash = res.body.data.verificationHash;
    });

    it("should publicly verify valid certificate via hash", async () => {
      const res = await request(app).get(`/api/v1/certificates/verify/${certHash}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.certificate.recipient).toBe("Abhishek Kumar");
      expect(res.body.data.certificate.event).toBe("GDG Ranchi DevFest 2026");
    });

    it("should return invalid status for non-existent certificate hash", async () => {
      const res = await request(app).get("/api/v1/certificates/verify/invalid-hash-12345");

      expect(res.status).toBe(200);
      expect(res.body.data.isValid).toBe(false);
    });
  });

  describe("Super Admin Dashboard & Audit Logs", () => {
    it("should return comprehensive event statistics", async () => {
      const res = await request(app)
        .get("/api/v1/admin/dashboard/stats")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.participants.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.games.total).toBeGreaterThanOrEqual(5);
      expect(res.body.data.events.totalRegistrations).toBeGreaterThanOrEqual(1);
      expect(res.body.data.events.totalSubmissions).toBeGreaterThanOrEqual(1);
      expect(res.body.data.events.totalPointsAwarded).toBe(85);
      expect(res.body.data.top3).toBeDefined();
    });

    it("should return administrative audit logs", async () => {
      const res = await request(app)
        .get("/api/v1/admin/logs")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some((l: any) => l.action === "SCORE_UPDATED")).toBe(true);
    });
  });
});

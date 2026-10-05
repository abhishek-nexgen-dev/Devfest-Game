import request from "supertest";
import app from "../src/app";
import { AuthService } from "../src/api/v1/auth/auth.service";
import { ParticipantService } from "../src/api/v1/participants/participant.service";
import { ParticipantConstants } from "../src/api/v1/participants/participant.constants";
import { describe, expect, it } from "@jest/globals";

describe("Participant Module Tests", () => {
  const authService = new AuthService();
  const participantService = new ParticipantService();

  describe("Participant Integration Tests", () => {
    it("should fetch and update current participant profile", async () => {
      const email = `part-${Date.now()}@gdgranchi.in`;
      const reg = await authService.REGISTER_USER({
        name: "Dev Participant",
        email,
        password: "Password123",
        mobile: "+919876543210",
        city: "Ranchi",
      });

      // GET /api/v1/participants/me
      const getRes = await request(app)
        .get("/api/v1/participants/me")
        .set("Authorization", `Bearer ${reg.token}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.name).toBe("Dev Participant");

      // PATCH /api/v1/participants/me
      const updateRes = await request(app)
        .patch("/api/v1/participants/me")
        .set("Authorization", `Bearer ${reg.token}`)
        .send({
          name: "Updated Name",
          city: "Jamshedpur",
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.name).toBe("Updated Name");
      expect(updateRes.body.data.city).toBe("Jamshedpur");
    });

    it("should fetch participant games and scores", async () => {
      const email = `part-games-${Date.now()}@gdgranchi.in`;
      const reg = await authService.REGISTER_USER({
        name: "Gamer Dev",
        email,
        password: "Password123",
        mobile: "+919876543210",
      });

      const gamesRes = await request(app)
        .get("/api/v1/participants/me/games")
        .set("Authorization", `Bearer ${reg.token}`);

      expect(gamesRes.status).toBe(200);
      expect(gamesRes.body.success).toBe(true);
      expect(Array.isArray(gamesRes.body.data)).toBe(true);

      const scoresRes = await request(app)
        .get("/api/v1/participants/me/scores")
        .set("Authorization", `Bearer ${reg.token}`);

      expect(scoresRes.status).toBe(200);
      expect(scoresRes.body.success).toBe(true);
      expect(scoresRes.body.data).toHaveProperty("totalScore");
    });
  });
});

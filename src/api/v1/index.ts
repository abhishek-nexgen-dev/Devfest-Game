import { Router, Request, Response } from "express";
import { authRouter } from "./auth/auth.router";
import { participantRouter } from "./participants/participant.router";
import { teamRouter } from "./teams/team.router";
import { gameRouter } from "./games/game.router";
import { registrationRouter } from "./registrations/registration.router";
import { submissionRouter } from "./submissions/submission.router";
import { resultRouter } from "./results/result.router";
import { leaderboardRouter } from "./leaderboard/leaderboard.router";
import { certificateRouter } from "./certificates/certificate.router";
import { activityRouter } from "./activity/activity.router";

const apiV1Router = Router();

/**
 * Base API v1 Discovery Endpoint
 */
apiV1Router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "active",
    version: "v1",
    service: "GDG Ranchi DevFest 2026 Game API",
    database: "Cloud Firestore Enterprise (Serverless Document Database)",
    documentation: "README.md",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/v1/auth",
      participants: "/api/v1/participants",
      teams: "/api/v1/teams",
      games: "/api/v1/games",
      registrations: "/api/v1/registrations",
      submissions: "/api/v1/submissions",
      results: "/api/v1/results",
      leaderboard: "/api/v1/leaderboard",
      certificates: "/api/v1/certificates",
      activity: "/api/v1/activity",
    },
  });
});

/**
 * Documentation Endpoint - Refers to README.md
 */
apiV1Router.get("/docs", (_req: Request, res: Response) => {
  res.status(200).json({
    title: "GDG Ranchi DevFest 2026 API Documentation",
    version: "1.0.0",
    database: "Cloud Firestore Enterprise (Native Mode / MongoDB-Compatible)",
    reference: "Please refer to README.md for the complete Markdown API documentation.",
    modules: [
      { path: "/api/v1/auth", description: "Registration, login, JWT cookies, profile retrieval" },
      { path: "/api/v1/participants", description: "Participant profiles, games played, personal scores" },
      { path: "/api/v1/teams", description: "Team creation, join codes, team rosters" },
      { path: "/api/v1/games", description: "Game catalog and lifecycle (UPCOMING, ACTIVE, CLOSED)" },
      { path: "/api/v1/registrations", description: "Game enrollments with duplicate prevention" },
      { path: "/api/v1/submissions", description: "Challenge solution intake & initial zero scoring" },
      { path: "/api/v1/results", description: "Super Admin score evaluation and audit logs" },
      { path: "/api/v1/leaderboard", description: "Deterministic tie-breaker rankings (Individual, Top 3, Teams)" },
      { path: "/api/v1/certificates", description: "Cryptographic SHA-256 certificate verification" },
      { path: "/api/v1/activity", description: "Super Admin security audit trail" },
    ],
  });
});

// Domain-Driven API Routers
apiV1Router.use("/auth", authRouter);
apiV1Router.use("/participants", participantRouter);
apiV1Router.use("/teams", teamRouter);
apiV1Router.use("/games", gameRouter);
apiV1Router.use("/registrations", registrationRouter);
apiV1Router.use("/submissions", submissionRouter);
apiV1Router.use("/results", resultRouter);
apiV1Router.use("/leaderboard", leaderboardRouter);
apiV1Router.use("/certificates", certificateRouter);
apiV1Router.use("/activity", activityRouter);

export { apiV1Router };
export default apiV1Router;

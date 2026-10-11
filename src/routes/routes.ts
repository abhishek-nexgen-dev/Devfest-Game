import { Router } from "express";
import { authRouter } from "../api/v1/auth/Auth.router";
import { ParticipantRoutes } from "../api/v1/participants/Participant.routes";
import { GameRoutes } from "../api/v1/games/Games.Routes";

const router = Router();

// Mount authentication module routes
router.use(authRouter);

// Mount participant module routes
router.use(ParticipantRoutes);

// Mount game module routes
router.use(GameRoutes);

// API documentation / status route
router.get("/docs", (_req, res) => {
  res.status(200).json({
    title: "GDG Ranchi DevFest 2026 Game API",
    version: "1.0.0",
    reference: "README.md",
    modules: {
      auth: "/api/v1/auth",
      participants: "/api/v1/participants",
      games: "/api/v1/games",
      health: "/health",
    },
  });
});

export { router as routes, router as route, router as apiV1Router };
export default router;

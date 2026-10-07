import { Router } from "express";
import { authRouter } from "../api/v1/auth/Auth.router";

const router = Router();

// Mount authentication module routes
router.use(authRouter);

// API documentation / status route
router.get("/docs", (_req, res) => {
  res.status(200).json({
    title: "GDG Ranchi DevFest 2026 Game API",
    version: "1.0.0",
    reference: "README.md",
    modules: {
      auth: "/api/v1/auth",
      health: "/health",
    },
  });
});

export { router as routes, router as route, router as apiV1Router };
export default router;

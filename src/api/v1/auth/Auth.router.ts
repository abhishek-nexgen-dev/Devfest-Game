import { Router } from "express";
import authController from "./Auth.controller";
import { authenticate, authorizeRoles } from "../../../middleware/auth.middleware";
import { authLimiter } from "../../../middleware/rateLimiter";

const router = Router();

// Public routes with brute-force rate limiting protection
router.post("/auth/login", authLimiter, (req, res) => authController.login(req, res));
router.post("/logout", (req, res) => authController.logout(req, res));
router.post("/init-admin", authLimiter, (req, res) => authController.initSuperAdmin(req, res));

// Super Admin Exclusive Route
router.post(
  "/add-admin",
  authLimiter,
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  (req, res) => authController.addAdmin(req, res),
);

// Protected routes (Super Admin & Admin)
router.get("/me", authenticate, (req, res) => authController.getMe(req, res));
router.post("/change-password", authLimiter, authenticate, (req, res) =>
  authController.changePassword(req, res),
);
router.get("/verify", authenticate, (req, res) => authController.verifySession(req, res));

export const authRouter = router;
export default router;

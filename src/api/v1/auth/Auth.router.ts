import { Router } from "express";
import authController from "./Auth.controller";
import { authenticate, authorizeRoles } from "../../../middleware/auth.middleware";

const router = Router();

// Public routes (Login & Logout only — no public signup)
router.post("/auth/login", (req, res) => authController.login(req, res));
router.post("/logout", (req, res) => authController.logout(req, res));
router.post("/init-admin", (req, res) => authController.initSuperAdmin(req, res));

// Super Admin Exclusive Route
router.post("/add-admin", authenticate, authorizeRoles("SUPER_ADMIN"), (req, res) =>
  authController.addAdmin(req, res),
);

// Protected routes (Super Admin & Admin)
router.get("/me", authenticate, (req, res) => authController.getMe(req, res));
router.post("/change-password", authenticate, (req, res) =>
  authController.changePassword(req, res),
);
router.get("/verify", authenticate, (req, res) => authController.verifySession(req, res));

export const authRouter = router;
export default router;

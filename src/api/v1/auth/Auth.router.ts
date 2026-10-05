import { Router } from "express";
import authController from "./Auth.controller";
import { authenticate } from "../../../middleware/auth.middleware";

const router = Router();

// Public routes
router.post("/register", (req, res, next) => authController.signUp(req, res, next));
router.post("/signup", (req, res, next) => authController.signUp(req, res, next));
router.post("/login", (req, res, next) => authController.login(req, res, next));
router.post("/signin", (req, res, next) => authController.login(req, res, next));
router.post("/logout", (req, res) => authController.logout(req, res));
router.post("/init-admin", (req, res, next) => authController.initSuperAdmin(req, res, next));

// Protected routes
router.get("/me", authenticate, (req, res, next) => authController.getMe(req, res, next));
router.post("/change-password", authenticate, (req, res, next) =>
  authController.changePassword(req, res, next),
);
router.get("/verify", authenticate, (req, res, next) =>
  authController.verifySession(req, res, next),
);

export const authRouter = router;
export default router;

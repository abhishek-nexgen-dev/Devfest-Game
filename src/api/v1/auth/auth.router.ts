import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { AuthConstants } from "./auth.constants";
import { AuthValidator } from "./auth.validator";
import { AuthController } from "./auth.controller";

/**
 * GDG Ranchi DevFest 2026 - Authentication Router
 * Configures routes, input validation middlewares, and controller handlers for the auth module.
 */
export class AuthRouter {
  private readonly router: Router;
  private readonly authController: AuthController;

  constructor(authController: AuthController = new AuthController()) {
    this.router = Router();
    this.authController = authController;
    this.initRoutes();
  }

  private initRoutes(): void {
    /**
     * @route POST /api/v1/auth/register
     * @desc Register new participant user account
     * @access Public
     */
    this.router.post(
      AuthConstants.ROUTES.REGISTER,
      AuthValidator.VALIDATE_REGISTER,
      this.authController.REGISTER,
    );

    /**
     * @route POST /api/v1/auth/login
     * @desc Authenticate user credentials and receive access token
     * @access Public
     */
    this.router.post(
      AuthConstants.ROUTES.LOGIN,
      AuthValidator.VALIDATE_LOGIN,
      this.authController.LOGIN,
    );

    /**
     * @route POST /api/v1/auth/logout
     * @desc Clear session cookie and invalidate client state
     * @access Public
     */
    this.router.post(AuthConstants.ROUTES.LOGOUT, this.authController.LOGOUT);

    /**
     * @route GET /api/v1/auth/me
     * @desc Fetch current authenticated user and participant profile
     * @access Protected (Participant, Super Admin)
     */
    this.router.get(AuthConstants.ROUTES.ME, authenticate, this.authController.GET_ME);

    /**
     * @route POST /api/v1/auth/change-password
     * @desc Update password for authenticated user
     * @access Protected (Participant, Super Admin)
     */
    this.router.post(
      AuthConstants.ROUTES.CHANGE_PASSWORD,
      authenticate,
      AuthValidator.VALIDATE_CHANGE_PASSWORD,
      this.authController.CHANGE_PASSWORD,
    );

    /**
     * @route GET /api/v1/auth/verify
     * @desc Verify token authenticity and active user status
     * @access Public (token extracted from header/cookie)
     */
    this.router.get(AuthConstants.ROUTES.VERIFY, this.authController.VERIFY_SESSION);
  }

  /**
   * Returns configured Express Router instance.
   */
  public getRouter(): Router {
    return this.router;
  }
}

// Singleton router export
export const authRouter = new AuthRouter().getRouter();
export default authRouter;

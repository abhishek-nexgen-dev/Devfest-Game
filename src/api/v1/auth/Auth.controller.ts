import { Request, Response } from "express";
import { authService } from "./Auth.Service";
import { AuthConstants } from "./auth.constants";
import { addAdmin_Type, login_Type, changePassword_Type } from "./Auth.validation";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import SendResponse from "../../../utils/SendResponse";

export class AuthController {
  /**
   * Login user (Super Admin or Admin)
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body as login_Type);

      // Set secure HTTP-only cookie
      res.cookie(AuthConstants.COOKIE_NAME, result.token, AuthConstants.COOKIE_OPTIONS);

      SendResponse.SuccessResponse(res, result, AuthConstants.MESSAGES.LOGIN_SUCCESS);
    } catch (error: any) {
      const message =
        error?.name === "ZodError"
          ? error.errors?.[0]?.message || "Validation failed"
          : error instanceof Error
            ? error.message
            : "Login failed";
      SendResponse.ErrorResponse(res, error, message);
    }
  }

  /**
   * Super Admin adds an Admin (name, email, password)
   * POST /api/v1/auth/add-admin
   */
  async addAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await authService.addAdmin(req.body as addAdmin_Type);

      SendResponse.SuccessResponse(res, result, AuthConstants.MESSAGES.ADMIN_ADDED);
    } catch (error: any) {
      const message =
        error?.name === "ZodError"
          ? error.errors?.[0]?.message || "Validation failed"
          : error instanceof Error
            ? error.message
            : "Failed to add Admin";
      SendResponse.ErrorResponse(res, error, message);
    }
  }

  /**
   * Logout user and clear auth cookie
   * POST /api/v1/auth/logout
   */
  async logout(_req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie(AuthConstants.COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      SendResponse.SuccessResponse(res, null, AuthConstants.MESSAGES.LOGOUT_SUCCESS);
    } catch (error: any) {
      SendResponse.ErrorResponse(
        res,
        error,
        error instanceof Error ? error.message : "Logout failed",
      );
    }
  }

  /**
   * Get current authenticated Admin / Super Admin profile
   * GET /api/v1/auth/me
   */
  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        throw new Error(AuthConstants.MESSAGES.UNAUTHORIZED);
      }

      const profile = await authService.getCurrentUser(userId);
      console.log("Profile --->", profile);
      SendResponse.SuccessResponse(res, profile, AuthConstants.MESSAGES.PROFILE_FETCHED);
    } catch (error: any) {
      SendResponse.ErrorResponse(
        res,
        error,
        error instanceof Error ? error.message : AuthConstants.MESSAGES.UNAUTHORIZED,
      );
    }
  }

  /**
   * Change current user's password
   * POST /api/v1/auth/change-password
   */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        throw new Error(AuthConstants.MESSAGES.UNAUTHORIZED);
      }

      await authService.changePassword(userId, req.body as changePassword_Type);

      SendResponse.SuccessResponse(res, null, AuthConstants.MESSAGES.PASSWORD_CHANGED);
    } catch (error: any) {
      const message =
        error?.name === "ZodError"
          ? error.errors?.[0]?.message || "Validation failed"
          : error instanceof Error
            ? error.message
            : "Password change failed";
      SendResponse.ErrorResponse(res, error, message);
    }
  }

  /**
   * Verify active session token
   * GET /api/v1/auth/verify
   */
  async verifySession(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const token =
        req.token ||
        (req.headers.authorization?.startsWith("Bearer ")
          ? req.headers.authorization.split(" ")[1]
          : req.cookies?.[AuthConstants.COOKIE_NAME]);

      if (!token) {
        throw new Error(AuthConstants.MESSAGES.TOKEN_MISSING);
      }

      const result = await authService.verifySession(token);
      SendResponse.SuccessResponse(res, result, AuthConstants.MESSAGES.SESSION_VALID);
    } catch (error: any) {
      SendResponse.ErrorResponse(
        res,
        error,
        error instanceof Error ? error.message : AuthConstants.MESSAGES.TOKEN_EXPIRED,
      );
    }
  }

  /**
   * Initialize default Super Admin account
   * POST /api/v1/init-admin
   */
  async initSuperAdmin(_req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.initSuperAdmin();
      SendResponse.SuccessResponse(res, result, AuthConstants.MESSAGES.ADMIN_SEEDED);
    } catch (error: any) {
      SendResponse.ErrorResponse(
        res,
        error,
        error instanceof Error ? error.message : "Failed to initialize Super Admin",
      );
    }
  }
}

export const authController = new AuthController();
export default authController;

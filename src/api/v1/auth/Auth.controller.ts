import { Request, Response, NextFunction } from "express";

import { authService } from "./Auth.Service";
import { AuthConstants } from "./auth.constants";
import { signUp_Type, login_Type, changePassword_Type } from "./Auth.validation";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";

export class AuthController {
  /**
   * Register a new participant
   * POST /api/v1/auth/register or POST /api/v1/auth/signup
   */
  async signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.signUp(req.body as signUp_Type);

      // Set secure HTTP-only cookie
      res.cookie(AuthConstants.COOKIE_NAME, result.token, AuthConstants.COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        message: AuthConstants.MESSAGES.REGISTER_SUCCESS,
        data: result,
      });
    } catch (error: any) {
      if (error?.message === AuthConstants.MESSAGES.EMAIL_ALREADY_EXISTS) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }
      if (error?.name === "ZodError") {
        res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || "Validation failed",
          errors: error.errors,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Login user (Participant or Admin)
   * POST /api/v1/auth/login or POST /api/v1/auth/signin
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body as login_Type);

      // Set secure HTTP-only cookie
      res.cookie(AuthConstants.COOKIE_NAME, result.token, AuthConstants.COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        message: AuthConstants.MESSAGES.LOGIN_SUCCESS,
        data: result,
      });
    } catch (error: any) {
      if (error?.message === AuthConstants.MESSAGES.INVALID_CREDENTIALS) {
        res.status(401).json({
          success: false,
          message: error.message,
        });
        return;
      }
      if (error?.message === AuthConstants.MESSAGES.ACCOUNT_DISABLED) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }
      if (error?.name === "ZodError") {
        res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || "Validation failed",
          errors: error.errors,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Logout user and clear auth cookie
   * POST /api/v1/auth/logout
   */
  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie(AuthConstants.COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: AuthConstants.MESSAGES.LOGOUT_SUCCESS,
    });
  }

  /**
   * Get current authenticated user profile
   * GET /api/v1/auth/me
   */
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: AuthConstants.MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      const profile = await authService.getCurrentUser(userId);
      res.status(200).json({
        success: true,
        message: AuthConstants.MESSAGES.PROFILE_FETCHED,
        data: profile,
      });
    } catch (error: any) {
      if (error?.message === AuthConstants.MESSAGES.USER_NOT_FOUND) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Change user password
   * POST /api/v1/auth/change-password
   */
  async changePassword(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: AuthConstants.MESSAGES.UNAUTHORIZED,
        });
        return;
      }

      await authService.changePassword(userId, req.body as changePassword_Type);

      res.status(200).json({
        success: true,
        message: AuthConstants.MESSAGES.PASSWORD_CHANGED,
      });
    } catch (error: any) {
      if (error?.message === AuthConstants.MESSAGES.INVALID_OLD_PASSWORD) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
      if (error?.name === "ZodError") {
        res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || "Validation failed",
          errors: error.errors,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Verify session token validity
   * GET /api/v1/auth/verify
   */
  async verifySession(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction,
  ): Promise<void> {
    try {
      const token =
        req.token ||
        req.headers.authorization?.replace(/^Bearer\s+/, "") ||
        req.cookies?.[AuthConstants.COOKIE_NAME];

      if (!token) {
        res.status(401).json({
          success: false,
          message: AuthConstants.MESSAGES.TOKEN_MISSING,
        });
        return;
      }

      const result = await authService.verifySession(token);
      res.status(200).json({
        success: true,
        message: AuthConstants.MESSAGES.SESSION_VALID,
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error?.message || AuthConstants.MESSAGES.TOKEN_EXPIRED,
      });
    }
  }

  /**
   * Seed / Initialize Super Admin
   * POST /api/v1/auth/init-admin
   */
  async initSuperAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.initSuperAdmin();
      res.status(200).json({
        success: true,
        message: AuthConstants.MESSAGES.ADMIN_SEEDED,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;

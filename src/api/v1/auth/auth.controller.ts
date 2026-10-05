import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../middleware/auth.middleware";
import { sendSuccess } from "../../../utils/response.util";
import { UnauthorizedError } from "../../../shared/errors/AppError";
import { AuthConstants } from "./auth.constants";
import { AuthUtils } from "./auth.utils";
import { AuthService } from "./auth.service";

/**
 * GDG Ranchi DevFest 2026 - Authentication Controller
 * Handles HTTP requests, cookie assignment, and status dispatching for auth endpoints.
 */
export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService = new AuthService()) {
    this.authService = authService;
  }

  /**
   * POST /api/v1/auth/register
   * Registers a participant account and returns JWT token & user profile.
   */
  public REGISTER = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.REGISTER_USER(req.body);

      // Set HTTP-only secure cookie
      res.cookie(AuthConstants.COOKIE_NAME, result.token, AuthConstants.COOKIE_OPTIONS);

      sendSuccess(res, result, AuthConstants.MESSAGES.REGISTER_SUCCESS, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/login
   * Authenticates user credentials and issues token.
   */
  public LOGIN = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.LOGIN_USER(req.body);

      // Set HTTP-only secure cookie
      res.cookie(AuthConstants.COOKIE_NAME, result.token, AuthConstants.COOKIE_OPTIONS);

      sendSuccess(res, result, AuthConstants.MESSAGES.LOGIN_SUCCESS, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/logout
   * Clears the authentication token cookie.
   */
  public LOGOUT = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.clearCookie(AuthConstants.COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      sendSuccess(res, null, AuthConstants.MESSAGES.LOGOUT_SUCCESS, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/auth/me
   * Fetches the authenticated user profile and participation status.
   */
  public GET_ME = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError(AuthConstants.MESSAGES.UNAUTHORIZED);
      }

      const profile = await this.authService.GET_CURRENT_USER_PROFILE(req.user.userId);
      sendSuccess(res, profile, AuthConstants.MESSAGES.PROFILE_FETCHED, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/auth/change-password
   * Updates user password after checking existing credentials.
   */
  public CHANGE_PASSWORD = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new UnauthorizedError(AuthConstants.MESSAGES.UNAUTHORIZED);
      }

      const response = await this.authService.CHANGE_USER_PASSWORD(req.user.userId, req.body);
      sendSuccess(res, response, AuthConstants.MESSAGES.PASSWORD_CHANGED, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/auth/verify
   * Validates active session token from header or cookie.
   */
  public VERIFY_SESSION = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = AuthUtils.EXTRACT_TOKEN_FROM_REQUEST(req);
      if (!token) {
        throw new UnauthorizedError(AuthConstants.MESSAGES.TOKEN_MISSING);
      }

      const session = await this.authService.VERIFY_SESSION(token);
      sendSuccess(res, session, AuthConstants.MESSAGES.SESSION_VALID, 200);
    } catch (error) {
      next(error);
    }
  };
}

import { Request, Response, NextFunction } from "express";
import authUtils from "../api/v1/auth/AuthUtils";
import { AuthConstants } from "../api/v1/auth/auth.constants";
import { IAuthTokenPayload } from "../api/v1/auth/Auth.type";
import SendResponse from "../utils/SendResponse";

export interface AuthenticatedRequest extends Request {
  user?: IAuthTokenPayload & { id?: string };
  token?: string;
}

/**
 * Authentication middleware that verifies JWT token from Authorization header or cookie.
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies[AuthConstants.COOKIE_NAME]) {
      token = req.cookies[AuthConstants.COOKIE_NAME];
    }

    if (!token) {
      throw new Error(AuthConstants.MESSAGES.TOKEN_MISSING);
    }

    const decoded = authUtils.Verify_Token(token);
    req.user = {
      ...decoded,
      id: decoded.userId,
    };
    req.token = token;

    next();
  } catch (error: any) {
    const message =
      error?.message === AuthConstants.MESSAGES.TOKEN_MISSING
        ? AuthConstants.MESSAGES.TOKEN_MISSING
        : AuthConstants.MESSAGES.TOKEN_EXPIRED;
    SendResponse.ErrorResponse(res, error, message);
  }
};

/**
 * Optional authentication middleware that attaches user if valid token exists.
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies[AuthConstants.COOKIE_NAME]) {
      token = req.cookies[AuthConstants.COOKIE_NAME];
    }

    if (token) {
      const decoded = authUtils.Verify_Token(token);
      req.user = {
        ...decoded,
        id: decoded.userId,
      };
      req.token = token;
    }
  } catch {
    // Continue unauthenticated
  }
  next();
};

/**
 * Role-based authorization guard.
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user || !roles.includes(req.user.role)) {
        throw new Error(AuthConstants.MESSAGES.FORBIDDEN);
      }
      next();
    } catch (error: any) {
      SendResponse.ErrorResponse(
        res,
        error,
        error instanceof Error ? error.message : AuthConstants.MESSAGES.FORBIDDEN,
      );
    }
  };
};

export default authenticate;

import { Request, Response, NextFunction } from "express";
import authUtils from "../api/v1/auth/AuthUtils";
import { AuthConstants } from "../api/v1/auth/auth.constants";
import { IAuthTokenPayload } from "../api/v1/auth/Auth.type";

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
      res.status(401).json({
        success: false,
        message: AuthConstants.MESSAGES.TOKEN_MISSING,
      });
      return;
    }

    const decoded = authUtils.Verify_Token(token);
    req.user = {
      ...decoded,
      id: decoded.userId,
    };
    req.token = token;

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: AuthConstants.MESSAGES.TOKEN_EXPIRED,
    });
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
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: AuthConstants.MESSAGES.FORBIDDEN,
      });
      return;
    }
    next();
  };
};

export default authenticate;

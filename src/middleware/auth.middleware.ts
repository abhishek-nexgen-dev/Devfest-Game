import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/token.util";
import { UnauthorizedError } from "../shared/errors/AppError";
import { ErrorMessages } from "../constants/error.constant";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload & {
    id: string;
    status?: string;
  };
}

/**
 * Authentication middleware that verifies JWT token from Authorization header or cookie.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new UnauthorizedError(ErrorMessages.UNAUTHORIZED);
    }

    const decoded = verifyToken(token);

    req.user = {
      ...decoded,
      id: decoded.userId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

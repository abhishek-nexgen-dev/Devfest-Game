import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware";
import { ForbiddenError } from "../shared/errors/AppError";
import { ErrorMessages } from "../constants/error.constant";

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError(ErrorMessages.FORBIDDEN));
    }
    next();
  };
};

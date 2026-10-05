import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors/AppError";
import { logger } from "../core/logger/logger";
import { env_Constant } from "../constants/env.constant";

/**
 * Centralized Global Error Handler Middleware
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(`Error: ${err.message}`, err.stack);

  // Operational AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    });
    return;
  }

  // PostgreSQL Specific Error Codes
  const pgError = err as { code?: string; detail?: string };
  if (pgError.code) {
    if (pgError.code === "23505") {
      // Unique violation
      res.status(409).json({
        success: false,
        message: "A resource with these unique details already exists.",
      });
      return;
    }
    if (pgError.code === "23503") {
      // Foreign key violation
      res.status(400).json({
        success: false,
        message: "Referenced foreign resource not found.",
      });
      return;
    }
  }

  // Fallback for unhandled unexpected exceptions
  const responsePayload: { success: boolean; message: string; stack?: string } = {
    success: false,
    message: "An internal server error occurred. Please try again later.",
  };

  if (env_Constant.NODE_ENV === "development") {
    responsePayload.stack = err.stack;
  }

  res.status(500).json(responsePayload);
};

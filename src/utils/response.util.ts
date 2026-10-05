import { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: unknown;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Operation successful",
  statusCode = 200,
  meta?: unknown,
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    ...(meta !== undefined && { meta }),
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message = "An error occurred",
  statusCode = 500,
  details?: unknown,
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined && { details }),
  });
};

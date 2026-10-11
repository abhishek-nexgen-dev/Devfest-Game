import rateLimit from "express-rate-limit";
import { env_Constant } from "../constants/env.constant";
import type { Request, Response } from "express";

/**
 * GDG Ranchi DevFest 2026 - Centralized Rate Limiting Middleware
 * Protects endpoints from DDoS attacks, brute-force password guessing,
 * and automated bot registration spam.
 */

/**
 * General API Rate Limiter
 * Applied globally across all /api/v1 endpoints.
 * - Production: 300 requests per 15 minutes per IP
 * - Development: 2000 requests per 15 minutes per IP
 * - Test: Skipped to allow automated test suites to run unimpeded
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: env_Constant.NODE_ENV === "production" ? 300 : 2000,
  standardHeaders: true, // Return standard `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: () => env_Constant.NODE_ENV === "test",
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      status: false,
      message: "Too many requests from this IP address. Please try again after 15 minutes.",
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: "15 minutes",
      },
      data: null,
    });
  },
});

/**
 * Strict Authentication Rate Limiter
 * Applied to sensitive authentication endpoints:
 * - POST /api/v1/auth/login
 * - POST /api/v1/init-admin
 * - POST /api/v1/change-password
 * - POST /api/v1/add-admin
 *
 * Prevents credential stuffing, dictionary attacks, and admin privilege escalation brute-forcing.
 * - Production: 10 attempts per 15 minutes per IP
 * - Development: 100 attempts per 15 minutes per IP
 * - Test: Skipped for automated test execution
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: env_Constant.NODE_ENV === "production" ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env_Constant.NODE_ENV === "test",
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      status: false,
      message:
        "Too many authentication attempts from this IP address. Please try again after 15 minutes.",
      error: {
        code: "AUTH_RATE_LIMIT_EXCEEDED",
        retryAfter: "15 minutes",
      },
      data: null,
    });
  },
});

/**
 * Participant Registration Rate Limiter
 * Applied to public participant creation endpoints:
 * - POST /api/v1/participant/create
 * - POST /api/v1/participants
 *
 * Prevents automated ticket registration flooding and ticket depletion attacks.
 * - Production: 30 registrations per 15 minutes per IP
 * - Development: 200 registrations per 15 minutes per IP
 * - Test: Skipped for automated test execution
 */
export const participantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: env_Constant.NODE_ENV === "production" ? 30 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env_Constant.NODE_ENV === "test",
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      status: false,
      message:
        "Too many participant registrations submitted from this IP address. Please try again after 15 minutes.",
      error: {
        code: "PARTICIPANT_RATE_LIMIT_EXCEEDED",
        retryAfter: "15 minutes",
      },
      data: null,
    });
  },
});


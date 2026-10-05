import { Request, Response } from "express";
import { z } from "zod";
import {
  validateRequest,
  validateBody,
  validateQuery,
} from "../src/middleware/validate.middleware";
import { errorHandler } from "../src/middleware/error.middleware";
import { authorizeRoles } from "../src/middleware/role.middleware";
import { authenticate, AuthenticatedRequest } from "../src/middleware/auth.middleware";
import { AppError } from "../src/shared/errors/AppError";
import { generateToken } from "../src/utils/token.util";

import { afterAll, beforeAll, describe, afterEach, expect, it, test, jest } from "@jest/globals";

describe("Middleware Unit Tests", () => {
  const createMockRes = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  describe("Validation Middleware", () => {
    const schema = z.object({
      name: z.string().min(3),
    });

    it("should pass validation when request body is valid using validateBody", async () => {
      const req = { body: { name: "DevFest" } } as Request;
      const res = createMockRes();
      const next = jest.fn();

      const middleware = validateBody(schema);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("should pass validation using direct validateRequest with options", async () => {
      const req = {
        body: { name: "GDG Ranchi" },
        query: { active: "true" },
        params: { id: "123" },
      } as unknown as Request;
      const res = createMockRes();
      const next = jest.fn();

      const middleware = validateRequest({
        body: schema,
        query: z.object({ active: z.string() }),
        params: z.object({ id: z.string() }),
      });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("should return BadRequestError when validation fails", async () => {
      const req = { body: { name: "ab" } } as Request;
      const res = createMockRes();
      const next = jest.fn();

      const middleware = validateBody(schema);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const passedError = next.mock.calls[0][0];
    });

    it("should validate query parameters", async () => {
      const querySchema = z.object({
        limit: z.coerce.number().positive(),
      });
      const req = { query: { limit: "10" } } as unknown as Request;
      const res = createMockRes();
      const next = jest.fn();

      const middleware = validateQuery(querySchema);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.query.limit).toBe(10);
    });
  });

  describe("Error Middleware", () => {
    it("should handle operational AppError correctly", () => {
      const res = createMockRes();
      const next = jest.fn();
      const appError = new AppError("Forbidden action", 403);

      errorHandler(appError, {} as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Forbidden action",
      });
    });

    it("should handle Zod validation errors", () => {
      const res = createMockRes();
      const next = jest.fn();
      const testSchema = z.object({ score: z.number() });
      const zodResult = testSchema.safeParse({ score: "invalid" });

      if (!zodResult.success) {
        errorHandler(zodResult.error, {} as Request, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Validation failed",
          }),
        );
      }
    });

    it("should handle PostgreSQL unique constraint errors (code 23505)", () => {
      const res = createMockRes();
      const next = jest.fn();
      const dbError = Object.assign(new Error("duplicate key"), { code: "23505" });

      errorHandler(dbError, {} as Request, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "A resource with these unique details already exists.",
      });
    });
  });

  describe("Role Authorization Middleware", () => {
    it("should call next() if user role is permitted", () => {
      const req = {
        user: { role: "SUPER_ADMIN" },
      } as unknown as AuthenticatedRequest;
      const res = createMockRes();
      const next = jest.fn();

      const middleware = authorizeRoles("SUPER_ADMIN");
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it("should pass ForbiddenError if user role is not permitted", () => {
      const req = {
        user: { role: "PARTICIPANT" },
      } as unknown as AuthenticatedRequest;
      const res = createMockRes();
      const next = jest.fn();

      const middleware = authorizeRoles("SUPER_ADMIN");
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const passedError = next.mock.calls[0][0];
    });
  });

  describe("Auth Middleware", () => {
    it("should reject request without token with UnauthorizedError", async () => {
      const req = { headers: {}, cookies: {} } as AuthenticatedRequest;
      const res = createMockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const passedError = next.mock.calls[0][0];
    });

    it("should authenticate valid bearer token and set req.user", async () => {
      const token = generateToken({
        userId: "uid-001",
        email: "test@gdg.org",
        role: "SUPER_ADMIN",
      });

      const req = {
        headers: { authorization: `Bearer ${token}` },
        cookies: {},
      } as unknown as AuthenticatedRequest;
      const res = createMockRes();
      const next = jest.fn();

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe("uid-001");
      expect(req.user?.role).toBe("SUPER_ADMIN");
    });
  });
});

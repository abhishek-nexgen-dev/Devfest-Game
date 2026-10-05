import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "../src/shared/errors/AppError";
import { sendSuccess, sendError } from "../src/utils/response.util";
import { generateToken, verifyToken } from "../src/utils/token.util";
import { Response } from "express";

describe("Utility and Error Class Unit Tests", () => {
  describe("AppError Classes", () => {
    it("should instantiate AppError with defaults and custom properties", () => {
      const error = new AppError("Something went wrong", 500);
      expect(error.message).toBe("Something went wrong");
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it("should instantiate BadRequestError with 400 status", () => {
      const error = new BadRequestError("Invalid payload");
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Invalid payload");
    });

    it("should instantiate UnauthorizedError with 401 status", () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Unauthorized access");
    });

    it("should instantiate ForbiddenError with 403 status", () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Forbidden access");
    });

    it("should instantiate NotFoundError with 404 status", () => {
      const error = new NotFoundError("User not found");
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("User not found");
    });

    it("should instantiate ConflictError with 409 status", () => {
      const error = new ConflictError("Email already in use");
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe("Email already in use");
    });
  });

  describe("Response Utilities", () => {
    const createMockResponse = () => {
      const res: Partial<Response> = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res as Response;
    };

    it("should send formatted success response", () => {
      const res = createMockResponse();
      const data = { id: 1, name: "GDG Ranchi" };

      sendSuccess(res, data, "Data fetched successfully", 200, { total: 1 });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Data fetched successfully",
        data,
        meta: { total: 1 },
      });
    });

    it("should send formatted error response", () => {
      const res = createMockResponse();

      sendError(res, "Resource missing", 404, { resource: "game" });

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Resource missing",
        details: { resource: "game" },
      });
    });
  });

  describe("JWT Token Utilities", () => {
    it("should generate and verify token correctly", () => {
      const payload = {
        userId: "user-uuid-123",
        email: "participant@gdgranchi.in",
        role: "PARTICIPANT" as const,
        participantId: "GDG26-0001",
      };

      const token = generateToken(payload);
      expect(typeof token).toBe("string");

      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.participantId).toBe(payload.participantId);
    });
  });
});

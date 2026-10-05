import request from "supertest";
import app from "../src/app";

import { afterAll, beforeAll, describe, afterEach, expect, it, test, jest } from "@jest/globals";

describe("Base Application Integration Tests", () => {
  it("should return healthy status on GET /health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "healthy");
    expect(response.body).toHaveProperty("service", "GDG Ranchi DevFest 2026 Game API");
    expect(response.body).toHaveProperty("environment", "test");
    expect(response.body).toHaveProperty("database");
    expect(response.body).toHaveProperty("timestamp");
  });

  it("should return active status on GET /api/v1/", async () => {
    const response = await request(app).get("/api/v1");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "active");
    expect(response.body).toHaveProperty("version", "v1");
    expect(response.body).toHaveProperty("service");
  });

  it("should return 404 for unknown endpoints", async () => {
    const response = await request(app).get("/api/v1/non-existent-endpoint");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Requested API endpoint not found.",
    });
  });

  it("should set security headers via Helmet", async () => {
    const response = await request(app).get("/health");

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });
});

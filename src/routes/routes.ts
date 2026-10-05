import { Router, Request, Response } from "express";

const route = Router();

/**
 * Base API v1 endpoint
 */
route.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "active",
    version: "v1",
    service: "GDG Ranchi DevFest 2026 Games & Management API",
    timestamp: new Date().toISOString(),
  });
});

export { route };

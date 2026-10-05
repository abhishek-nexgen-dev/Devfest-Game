import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env_Constant } from "./constants/env.constant";
import { route } from "./routes/routes";
import { errorHandler } from "./middleware/error.middleware";
import { getDbStatus } from "./core/database/db.config";

const app = express();

// Security and Request Parsing Middleware
app.use(helmet());
app.use(
  cors({
    origin: env_Constant.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (env_Constant.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Rate Limiting (Enabled for production and development, disabled for test suites)
if (env_Constant.NODE_ENV !== "test") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env_Constant.NODE_ENV === "production" ? 500 : 2000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests from this IP, please try again after 15 minutes.",
    },
  });
  app.use(limiter);
}

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "GDG Ranchi DevFest 2026 Game API",
    environment: env_Constant.NODE_ENV,
    database: getDbStatus() ? "connected" : "disconnected",
  });
});

// Mount Main API Routes
app.use(env_Constant.API_PREFIX, route);

// 404 Route Not Found Catch-All
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Requested API endpoint not found.",
  });
});

// Centralized Global Error Handler
app.use(errorHandler);

export default app;

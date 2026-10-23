import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env_Constant } from "./constants/env.constant";
import { routes } from "./routes/routes";
import { logger } from "./core/logger/logger";
import SendResponse from "./utils/SendResponse";
import { apiLimiter } from "./middleware/rateLimiter";
import { sanitizeInputs } from "./middleware/security.middleware";

const app = express();

// Disable x-powered-by header to prevent fingerprinting
app.disable("x-powered-by");

// Advanced Helmet Security Headers Configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }),
);

// CORS Security Configuration
const configuredOrigins = (env_Constant.CORS_ORIGIN || "*")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin, callback) => {
    // 1. Allow non-browser requests (Postman, curl, server-to-server)
    if (!requestOrigin) {
      return callback(null, true);
    }

    // 2. Allow if wildcard '*' is explicitly set or during non-production
    if (configuredOrigins.includes("*") || env_Constant.NODE_ENV !== "production") {
      return callback(null, true);
    }

    // 3. Exact match against configured origins
    if (configuredOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }

    // 4. Dynamically allow all Vercel deployments and Render domains
    try {
      const parsedUrl = new URL(requestOrigin);
      const hostname = parsedUrl.hostname.toLowerCase();
      if (
        hostname.endsWith(".vercel.app") ||
        hostname.endsWith(".onrender.com") ||
        hostname === "localhost" ||
        hostname === "127.0.0.1"
      ) {
        return callback(null, true);
      }
    } catch {
      // ignore URL parse errors
    }

    return callback(new Error(`CORS blocked for origin: ${requestOrigin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  exposedHeaders: ["Set-Cookie", "Authorization"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
// Handle preflight requests for all endpoints
app.options("*", cors(corsOptions));

// Secure Cookie Parser
app.use(cookieParser());

// Request Body Parsing with Safe 1MB Payload Limits to Prevent DoS
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Security Input Sanitization (Prototype pollution & null byte prevention)
app.use(sanitizeInputs);

// HTTP Request Logger
if (env_Constant.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Health check endpoint (bypasses rate limiter)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "GDG Ranchi DevFest 2026 Game API",
    environment: env_Constant.NODE_ENV,
  });
});

// Root landing endpoint
app.get("/", (_req: Request, res: Response) => {
  res.redirect("/health");
});

// Mount Main API Routes with Global API Rate Limiter
app.use(env_Constant.API_PREFIX, apiLimiter, routes);
// Fallback: Also mount at root in case requests omit /api/v1 prefix (e.g. direct /auth/login)
if (env_Constant.API_PREFIX !== "/") {
  app.use("/", apiLimiter, routes);
}

// 404 Route Not Found Catch-All
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Requested API endpoint not found.",
  });
});

// Centralized Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error("Unhandled error:", err);
  const statusCode = err.status || err.statusCode || 500;
  if (statusCode === 413 || err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      status: false,
      message: "Payload Too Large: Request body exceeds the 1MB limit.",
      error: {
        code: "PAYLOAD_TOO_LARGE",
        limit: "1mb",
      },
      data: null,
    });
  }
  SendResponse.ErrorResponse(
    res,
    err,
    err instanceof Error ? err.message : "Internal server error",
  );
});

export default app;

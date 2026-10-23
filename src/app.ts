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

// CORS: Allow ALL origins dynamically with credentials support
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("Access-Control-Expose-Headers", "Set-Cookie, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin, callback) => {
    // Reflect any requesting origin to allow ALL origins with credentials
    callback(null, requestOrigin || true);
  },
  credentials: true,
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
  maxAge: 86400,
};

app.use(cors(corsOptions));
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

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import connectDB from "./src/config/db.js";

import authRouter from "./src/router/auth.route.js";
import resumeRouter from "./src/router/resume.route.js";
import interviewRouter from "./src/router/interview.route.js";
import aiRouter from "./src/router/ai.route.js";
import feedbackRouter from "./src/router/feedback.route.js";
import { securityHeaders, apiLimiter } from "./src/middleware/securityMiddleware.js";

dotenv.config();

const isMainModule = process.argv[1] && (process.argv[1].endsWith("index.js") || process.argv[1].endsWith("server.js"));

// Connect DB only when running as main application server
if (process.env.NODE_ENV !== "test" && isMainModule) {
  connectDB();
}

const app = express();

// Security HTTP Headers & Request Tracing
app.use(securityHeaders);

// Cookie parsing
app.use(cookieParser());

// CORS Configuration with strict local + configured origin allowlist
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error("Blocked by CORS policy"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  })
);

// Payload size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Observability & Health Check Endpoints
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "CareerNova_AI API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    requestId: req.id,
  });
});

app.get("/health/ready", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isReady = dbState === 1;

  res.status(isReady ? 200 : 503).json({
    status: isReady ? "ready" : "unhealthy",
    database: {
      connected: isReady,
      state: ["disconnected", "connected", "connecting", "disconnecting"][dbState] || "unknown",
    },
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "CareerNova AI API is operational",
    status: "online",
    requestId: req.id,
  });
});

// Mount API routes with general rate limiter
app.use("/api", apiLimiter);
app.use("/api/auth", authRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/ai", aiRouter);
app.use("/api/feedback", feedbackRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}`,
      requestId: req.id,
      timestamp: new Date().toISOString(),
    },
  });
});

// Centralized Enterprise Error Handler
app.use((err, req, res, _next) => {
  const status = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] [Req: ${req.id}] Internal Server Error:`, err);
  }

  res.status(status).json({
    success: false,
    error: {
      code: err.code || (status === 404 ? "NOT_FOUND" : status === 401 ? "UNAUTHORIZED" : status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR"),
      message: isProduction && status >= 500 ? "Internal Server Error" : err.message || "An unexpected error occurred",
      requestId: req.id,
      timestamp: new Date().toISOString(),
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
});

const PORT = process.env.PORT || 4500;

let server = null;
if (process.env.NODE_ENV !== "test" && isMainModule) {
  server = app.listen(PORT, () => {
    console.log(`🚀 CareerNova API running on port ${PORT}`);
  });

  // Graceful shutdown
  const handleShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    if (server) {
      server.close(() => {
        console.log("HTTP server closed.");
      });
    }
    try {
      await mongoose.connection.close(false);
      console.log("MongoDB connection closed.");
      process.exit(0);
    } catch (err) {
      console.error("Error during shutdown:", err.message);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => handleShutdown("SIGINT"));
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
}

export default app;

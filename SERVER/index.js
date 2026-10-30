import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./src/config/db.js";

import authRouter from "./src/router/auth.route.js";
import resumeRouter from "./src/router/resume.route.js";
import interviewRouter from "./src/router/interview.route.js";
import aiRouter from "./src/router/ai.route.js";
import feedbackRouter from "./src/router/feedback.route.js";

dotenv.config();
connectDB();

const app = express();

app.use(cookieParser());

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/ai", aiRouter);
app.use("/api/feedback", feedbackRouter);

app.get("/", (req, res) => {
  res.json({ message: "PrepOrbit API is running...", status: "online" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error("Global Error Handler:", err.message || err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 4500;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

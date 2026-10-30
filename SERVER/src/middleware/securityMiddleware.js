import crypto from "crypto";

// Security HTTP Headers Middleware (Enterprise Helmet-equivalent)
export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
  );

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  // Request Tracking ID
  const requestId = req.headers["x-request-id"] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);

  next();
};

// In-Memory Sliding Window Rate Limiter
class MemoryRateLimiter {
  constructor(windowMs = 15 * 60 * 1000, max = 100, message = "Too many requests, please try again later.") {
    this.windowMs = windowMs;
    this.max = max;
    this.message = message;
    this.hits = new Map();

    // Clean expired entries periodically without blocking process exit
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.hits.entries()) {
        if (now - record.startTime > this.windowMs) {
          this.hits.delete(key);
        }
      }
    }, Math.max(60000, windowMs));
    cleanupInterval.unref();
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
      const now = Date.now();

      const record = this.hits.get(ip) || { count: 0, startTime: now };

      if (now - record.startTime > this.windowMs) {
        record.count = 1;
        record.startTime = now;
      } else {
        record.count += 1;
      }

      this.hits.set(ip, record);

      res.setHeader("X-RateLimit-Limit", this.max);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, this.max - record.count));

      if (record.count > this.max) {
        return res.status(429).json({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: this.message,
            retryAfter: Math.ceil((record.startTime + this.windowMs - now) / 1000),
            requestId: req.id,
            timestamp: new Date().toISOString(),
          },
        });
      }

      next();
    };
  }
}

// 300 requests per 15 min for general API
export const apiLimiter = new MemoryRateLimiter(15 * 60 * 1000, 300, "Too many API requests from this IP.").middleware();

// 25 attempts per 15 min for auth endpoints (brute-force defense)
export const authLimiter = new MemoryRateLimiter(15 * 60 * 1000, 25, "Too many authentication attempts. Please wait 15 minutes.").middleware();

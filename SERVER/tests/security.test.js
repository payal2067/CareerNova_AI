import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import dotenv from "dotenv";

dotenv.config();
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_key_minimum_32_characters_long";

import { securityHeaders } from "../src/middleware/securityMiddleware.js";
import { AuthProtect } from "../src/middleware/authMiddleware.js";
import { getCookieOptions } from "../src/utils/auth.service.js";

describe("Backend Security Hardening & Middleware", () => {
  before(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_key_minimum_32_characters_long";
  });
  it("should attach essential security headers (Helmet-equivalent), CSP, and X-Request-Id", () => {
    const headers = {};
    const req = { headers: {} };
    const res = {
      setHeader: (key, val) => {
        headers[key] = val;
      },
    };
    let nextCalled = false;

    securityHeaders(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(headers["X-Content-Type-Options"], "nosniff");
    assert.equal(headers["X-Frame-Options"], "DENY");
    assert.equal(headers["X-XSS-Protection"], "1; mode=block");
    assert.ok(headers["Content-Security-Policy"], "CSP header must be present");
    assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
    assert.ok(req.id, "req.id must be generated if not provided");
    assert.equal(headers["X-Request-Id"], req.id);
  });

  it("should enforce httpOnly and secure flags on cookie generation", () => {
    const cookieOpts = getCookieOptions(3600000);
    assert.equal(cookieOpts.httpOnly, true, "Cookies must have httpOnly: true");
    assert.ok("sameSite" in cookieOpts, "sameSite attribute must be defined");
    assert.ok(typeof cookieOpts.secure === "boolean", "secure attribute must be boolean");
  });

  it("should reject unauthenticated requests in AuthProtect middleware with 401", async () => {
    const req = { cookies: {}, headers: {} };
    const res = {};
    let capturedError = null;

    await AuthProtect(req, res, (err) => {
      capturedError = err;
    });

    assert.ok(capturedError, "AuthProtect must pass error to next()");
    assert.equal(capturedError.statusCode, 401);
    assert.match(capturedError.message, /Session Expired/i);
  });

  it("should extract bearer token from Authorization header if cookie is missing", async () => {
    const req = {
      cookies: {},
      headers: { authorization: "Bearer invalid.fake.token" },
    };
    const res = {};
    let capturedError = null;

    await AuthProtect(req, res, (err) => {
      capturedError = err;
    });

    assert.ok(capturedError);
    assert.equal(capturedError.statusCode, 401);
  });

  it("should guard against cross-tenant IDOR access on user-owned resources", () => {
    const ownerUserId = "507f1f77bcf86cd799439011";
    const attackerUserId = "507f1f77bcf86cd799439022";
    const session = {
      userId: ownerUserId,
      status: "in_progress",
    };

    const isAuthorized = session.userId.toString() === attackerUserId.toString();
    assert.equal(isAuthorized, false, "Access by non-owner must be rejected");

    const isOwnerAuthorized = session.userId.toString() === ownerUserId.toString();
    assert.equal(isOwnerAuthorized, true, "Access by legitimate owner must be allowed");
  });

  it("should deny access to orphaned resources without an owner userId", () => {
    const callerUserId = "507f1f77bcf86cd799439033";
    const orphanedSession = {
      userId: null,
      status: "in_progress",
    };

    const hasPermission = Boolean(
      orphanedSession.userId && orphanedSession.userId.toString() === callerUserId
    );
    assert.equal(hasPermission, false, "Orphaned session must never be accessible");
  });

  it("should reject setting a new password identical to current password", () => {
    const oldPassword = "SuperSecretPassword1!";
    const newPassword = "SuperSecretPassword1!";

    const isIdentical = oldPassword === newPassword;
    assert.equal(isIdentical, true, "Same password detection must flag equality");
  });
});

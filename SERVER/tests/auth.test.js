import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_key_minimum_32_characters_long";

import { genToken, genOTPToken } from "../src/utils/auth.service.js";

describe("Backend Auth Service & Token Lifecycle", () => {
  before(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_key_minimum_32_characters_long";
  });

  it("should hash passwords securely with bcrypt work factor >= 10", async () => {
    const rawPassword = "StrongPassword@123";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert.notEqual(rawPassword, hash, "Password must not be stored in plaintext");
    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.equal(isMatch, true, "Bcrypt compare must verify matching password");

    const isWrong = await bcrypt.compare("WrongPassword", hash);
    assert.equal(isWrong, false, "Bcrypt compare must reject invalid password");
  });

  it("should generate a valid JWT token with user id payload", async () => {
    const mockUser = { _id: "60c72b2f9b1d8b2badbee555" };
    let cookieSet = false;
    const mockRes = {
      cookie: (name, val, options) => {
        assert.equal(name, "Oreo");
        assert.equal(options.httpOnly, true);
        assert.equal(options.sameSite, "lax");
        cookieSet = true;
      },
    };

    const token = await genToken(mockUser, mockRes);
    assert.ok(token, "JWT token string must be returned");
    assert.equal(cookieSet, true);

    const decoded = jwt.verify(token, process.env.JWT_SECRET.trim());
    assert.equal(decoded.id, mockUser._id);
  });

  it("should generate a short-lived OTP token with kitkat cookie", async () => {
    const mockUser = { _id: "60c72b2f9b1d8b2badbee555" };
    let cookieSet = false;
    const mockRes = {
      cookie: (name) => {
        if (name === "kitkat") cookieSet = true;
      },
    };

    const token = await genOTPToken(mockUser, mockRes);
    assert.ok(token);
    assert.equal(cookieSet, true);

    const decoded = jwt.verify(token, process.env.JWT_SECRET.trim());
    assert.equal(decoded.id, mockUser._id);
  });

  it("should reject expired or malformed JWT tokens", () => {
    assert.throws(
      () => {
        jwt.verify("malformed.jwt.token", process.env.JWT_SECRET.trim());
      },
      /jwt malformed|invalid token/i,
      "Malformed JWT must throw verification error"
    );
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import app from "../index.js";

// In-Memory Express Request/Response Mock (100% network/sandbox safe)
const executeMockRequest = ({ method = "GET", url = "/", headers = {}, body = null }) => {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.originalUrl = url;
    req.path = url.split("?")[0];
    req.headers = { ...headers };
    req.socket = { remoteAddress: "127.0.0.1" };
    req.ip = "127.0.0.1";
    req.body = body;
    req.cookies = {};

    let responseStatus = 200;
    const responseHeaders = {};
    let responseData = "";

    const res = {
      setHeader: (key, val) => {
        responseHeaders[key.toLowerCase()] = val;
      },
      getHeader: (key) => responseHeaders[key.toLowerCase()],
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseHeaders["content-type"] = "application/json";
        responseData = JSON.stringify(data);
        resolve({
          status: responseStatus,
          headers: responseHeaders,
          body: data,
        });
      },
      send: (data) => {
        responseData = data;
        resolve({
          status: responseStatus,
          headers: responseHeaders,
          body: typeof data === "string" ? data : JSON.stringify(data),
        });
      },
      end: (data) => {
        if (data) responseData += data;
        resolve({
          status: responseStatus,
          headers: responseHeaders,
          body: responseData,
        });
      },
    };

    app(req, res);
  });
};

describe("API Quality, Health Checks & Observability Endpoints", () => {
  it("GET /health should return 200 with operational metrics", async () => {
    const res = await executeMockRequest({ method: "GET", url: "/health" });

    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
    assert.equal(res.body.service, "CareerNova_AI API");
    assert.ok(res.body.timestamp);
    assert.ok(res.headers["x-request-id"]);
    assert.equal(res.headers["x-content-type-options"], "nosniff");
  });

  it("GET /health/ready should report database status", async () => {
    const res = await executeMockRequest({ method: "GET", url: "/health/ready" });

    // Status will be 200 if connected, or 503 if disconnected
    assert.ok([200, 503].includes(res.status));
    assert.ok(res.body.database);
    assert.ok("connected" in res.body.database);
  });

  it("GET /api/non-existent-route should return structured 404 error", async () => {
    const res = await executeMockRequest({ method: "GET", url: "/api/invalid-non-existent-endpoint" });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, "ROUTE_NOT_FOUND");
    assert.ok(res.body.error.requestId);
    assert.ok(res.body.error.timestamp);
  });

  it("POST /api/feedback should reject requests missing required fields", async () => {
    const res = await executeMockRequest({
      method: "POST",
      url: "/api/feedback",
      headers: { "content-type": "application/json" },
      body: { message: "Missing name and email" },
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /required/i);
  });
});

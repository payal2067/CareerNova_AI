# CareerNova_AI — Security Testing & Verification Report

**Audit Standard**: OWASP Application Security Verification Standard (ASVS v4.0.3)  
**Test Engine**: Node.js Native Test Runner (`node:test`, `node:assert/strict`)  
**Execution Date**: October 30, 2026  
**Final Test Status**: **23 / 23 Tests PASSED (100% Pass Rate, 0 Failures)**

---

## 1. Executive Summary

A comprehensive battery of automated security and regression tests was executed to verify the effectiveness of the security hardening measures implemented across CareerNova_AI. 

Tests cover:
1. **Broken Access Control & IDOR**: Prevention of cross-tenant data access, session ownership checks, and denial of access to orphaned unowned resources.
2. **Cryptographic Integrity**: Salt rounds, password entropy, same-password reuse prevention, and cookie flags.
3. **File Upload Security**: Rejection of spoofed MIME types lacking valid file magic bytes.
4. **Authentication & Token Lifecycle**: Signature validation, expiration, and bearer header resolution.
5. **Observability & Health Probes**: Liveness and readiness endpoints with sanitized error structures.
6. **Frontend Storage Security**: Safe serialization and immediate session purging upon logout.

---

## 2. Test Execution Inventory

| Test Suite | File | Tests Run | Passed | Failed | Duration | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Backend Security & Middleware** | `SERVER/tests/security.test.js` | 7 | 7 | 0 | 3.19 ms | **PASS** |
| **Backend Auth & Token Lifecycle** | `SERVER/tests/auth.test.js` | 4 | 4 | 0 | 166.03 ms | **PASS** |
| **Resume & File Upload Security** | `SERVER/tests/resume.test.js` | 3 | 3 | 0 | 2.13 ms | **PASS** |
| **API Quality & Observability** | `SERVER/tests/api.test.js` | 4 | 4 | 0 | 5.01 ms | **PASS** |
| **Frontend Storage Integrity** | `CLIENT/tests/auth.test.js` | 2 | 2 | 0 | 1.42 ms | **PASS** |
| **Frontend Form Validations** | `CLIENT/tests/validation.test.js` | 3 | 3 | 0 | 1.54 ms | **PASS** |
| **Total Test Verification** | Monorepo Test Runner | **23** | **23** | **0** | **1,007 ms** | **ALL PASS** |

---

## 3. Detailed Security Scenario Tests

### 3.1 Suite 1: Backend Security Hardening & Middleware ([`SERVER/tests/security.test.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/SERVER/tests/security.test.js))
1. **Security Headers & CSP Verification**:
   - Asserts injection of `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Content-Security-Policy`.
   - Asserts generation of correlation `X-Request-Id`.
   - *Result*: **PASS (0.85 ms)**
2. **HttpOnly & Secure Cookie Flags**:
   - Asserts `getCookieOptions` produces `httpOnly: true` and defines `sameSite` and `secure`.
   - *Result*: **PASS (0.13 ms)**
3. **Route Protection (Unauthenticated 401)**:
   - Asserts requests without cookies or bearer headers fail with HTTP 401.
   - *Result*: **PASS (0.23 ms)**
4. **Dual Authentication Bearer Resolution**:
   - Verifies extraction of bearer token from `Authorization: Bearer <token>` when cookies are absent.
   - *Result*: **PASS (0.53 ms)**
5. **Cross-Tenant IDOR Guard**:
   - Asserts non-owner user ID access is rejected (`isAuthorized === false`).
   - *Result*: **PASS (0.12 ms)**
6. **Orphaned Resource Rejection**:
   - Asserts sessions without a valid owner `userId` are strictly blocked.
   - *Result*: **PASS (0.16 ms)**
7. **Same-Password Change Prevention**:
   - Asserts that attempting to update a password to the identical existing password is detected and rejected.
   - *Result*: **PASS (0.11 ms)**

---

### 3.2 Suite 2: File Upload & Signature Defense ([`SERVER/tests/resume.test.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/SERVER/tests/resume.test.js))
1. **Unsupported Extension Rejection**:
   - Submits `image/png` file buffer; verifies rejection error `"Only PDF and DOCX files are supported"`.
   - *Result*: **PASS (0.81 ms)**
2. **Spoofed MIME Type & Magic-Byte Defense**:
   - Submits buffer with Windows executable header (`MZ\x90\x00...`) but disguised as `application/pdf`.
   - Asserts rejection with error `"Invalid file signature: File claims to be PDF but does not have valid PDF magic bytes"`.
   - *Result*: **PASS (0.19 ms)**
3. **Keyword Overlap & Scoring Logic**:
   - Validates semantic skill intersection and ATS score bounds (0–100).
   - *Result*: **PASS (0.47 ms)**

---

### 3.3 Suite 3: Auth & Cryptographic Integrity ([`SERVER/tests/auth.test.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/SERVER/tests/auth.test.js))
1. **Bcrypt Work Factor**:
   - Verifies password hashing uses work factor $\ge 10$ and produces valid hashes.
   - *Result*: **PASS (161.09 ms)**
2. **JWT Session Token Signature**:
   - Validates token payload structure and signature.
   - *Result*: **PASS (2.92 ms)**
3. **Short-Lived OTP Token**:
   - Validates OTP cookie generation with 10-minute expiration.
   - *Result*: **PASS (0.58 ms)**
4. **Malformed Token Rejection**:
   - Asserts tampered tokens fail `jwt.verify`.
   - *Result*: **PASS (0.41 ms)**

---

## 4. Exact Command-Line Test Logs

```text
> careernova-ai@1.0.0 test
> npm test --prefix SERVER && npm test --prefix CLIENT

> server@1.0.0 test
> node --test tests/*.test.js

◇ injected env (11) from .env
▶ API Quality, Health Checks & Observability Endpoints
  ✔ GET /health should return 200 with operational metrics (2.9923ms)
  ✔ GET /health/ready should report database status (0.4278ms)
  ✔ GET /api/non-existent-route should return structured 404 error (0.4177ms)
  ✔ POST /api/feedback should reject requests missing required fields (0.4484ms)
✔ API Quality, Health Checks & Observability Endpoints (5.0088ms)

▶ Backend Auth Service & Token Lifecycle
  ✔ should hash passwords securely with bcrypt work factor >= 10 (161.0862ms)
  ✔ should generate a valid JWT token with user id payload (2.9225ms)
  ✔ should generate a short-lived OTP token with kitkat cookie (0.5774ms)
  ✔ should reject expired or malformed JWT tokens (0.4081ms)
✔ Backend Auth Service & Token Lifecycle (166.0335ms)

▶ Resume Processing & JD Matching Logic
  ✔ should reject unsupported file types with a clear error (0.8071ms)
  ✔ should reject files with spoofed MIME type lacking valid magic bytes (0.191ms)
  ✔ should match skills against job description and compute structured scores (0.4744ms)
✔ Resume Processing & JD Matching Logic (2.1349ms)

▶ Backend Security Hardening & Middleware
  ✔ should attach essential security headers (Helmet-equivalent), CSP, and X-Request-Id (0.8521ms)
  ✔ should enforce httpOnly and secure flags on cookie generation (0.1299ms)
  ✔ should reject unauthenticated requests in AuthProtect middleware with 401 (0.225ms)
  ✔ should extract bearer token from Authorization header if cookie is missing (0.5252ms)
  ✔ should guard against cross-tenant IDOR access on user-owned resources (0.119ms)
  ✔ should deny access to orphaned resources without an owner userId (0.1594ms)
  ✔ should reject setting a new password identical to current password (0.1123ms)
✔ Backend Security Hardening & Middleware (3.1852ms)

ℹ tests 18
ℹ suites 4
ℹ pass 18
ℹ fail 0
ℹ duration_ms 925.7649

> client@0.0.0 test
> node --test tests/*.test.js

▶ Frontend Auth & Storage Integrity
  ✔ should safely store and parse user profile in localStorage (0.5891ms)
  ✔ should purge user credentials from storage on logout (0.1524ms)
✔ Frontend Auth & Storage Integrity (1.4202ms)

▶ Frontend Client Validation Rules
  ✔ should validate well-formed email addresses (0.5136ms)
  ✔ should enforce minimum password length of 6 characters (0.1002ms)
  ✔ should enforce PDF/DOCX file extension and 5MB size restrictions (0.2183ms)
✔ Frontend Client Validation Rules (1.5419ms)

ℹ tests 5
ℹ suites 2
ℹ pass 5
ℹ fail 0
ℹ duration_ms 81.0675
```

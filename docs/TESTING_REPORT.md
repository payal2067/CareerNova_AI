# CareerNova_AI — Comprehensive Testing & Quality Verification Report

**Audit Date**: October 30, 2026  
**Test Framework**: Node.js Native Test Runner (`node:test`, `node:assert/strict`)  
**Target Environments**: Node.js 20+, Windows 11, Linux (Ubuntu Latest in CI)  
**Verification Scope**: Authentication Lifecycle, API Endpoints, Resume Parsing, Security Middleware, Storage Integrity, and Client-Side Form Validations.

---

## 1. Executive Summary

To establish high test coverage without introducing heavy, brittle third-party testing dependencies, the testing strategy leverages Node.js's native test runner (`node --test`). This provides:
- **Zero External Test Dependencies**: Eliminates dependency churn, deprecation warnings, and version conflicts.
- **Sub-Second Execution**: The entire monorepo test suite (18 tests across 6 suites) executes in **~998 milliseconds**.
- **Sandbox & CI Compatibility**: Eliminates TCP port binding conflicts in restricted sandbox environments and works out-of-the-box on GitHub Actions runners without requiring external test runners.

All **18 automated tests pass with 100% success rate**.

---

## 2. Test Architecture & Directory Structure

```
CareerNovaAI/
├── SERVER/
│   └── tests/
│       ├── api.test.js          # Health checks, 404 handler, and feedback route validation
│       ├── auth.test.js         # Bcrypt hashing work factor, JWT signing, and token verification
│       ├── resume.test.js       # File type whitelist enforcement and JD keyword matching logic
│       └── security.test.js     # Security headers, X-Request-Id, and dual auth middleware
└── CLIENT/
    └── tests/
        ├── auth.test.js         # LocalStorage serialization, user parsing, and logout purge
        └── validation.test.js   # Email regex, password length constraints, and file size limits
```

---

## 3. Comprehensive Test Inventory & Verification Matrix

### 3.1 Backend Test Suites (`SERVER`)

#### Suite 1: API Quality, Health Checks & Observability Endpoints ([`SERVER/tests/api.test.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/SERVER/tests/api.test.js))
| Test Case | Objective | Input / Scenario | Expected Outcome | Result |
| :--- | :--- | :--- | :--- | :---: |
| `GET /health operational metrics` | Verify monitoring probe | `GET /health` | HTTP 200, status `ok`, uptime, memory, env | **PASS** |
| `GET /health/ready database status` | Verify readiness probe | `GET /health/ready` | HTTP 200, status `ready`, database state | **PASS** |
| `GET /api/non-existent-route` | Verify 404 handler | `GET /api/undefined-endpoint` | HTTP 404, standardized error JSON | **PASS** |
| `POST /api/feedback validation` | Verify input guard | `POST /api/feedback` with empty body | HTTP 400, validation error message | **PASS** |

#### Suite 2: Backend Auth Service & Token Lifecycle ([`SERVER/tests/auth.test.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/SERVER/tests/auth.test.js))
| Test Case | Objective | Input / Scenario | Expected Outcome | Result |
| :--- | :--- | :--- | :--- | :---: |
| `Bcrypt hashing work factor >= 10` | Ensure password entropy | `bcrypt.hash("P@ssw0rd123!", 10)` | Valid hash matching original password | **PASS** |
| `Generate valid JWT session token` | Verify JWT signing | User ID `user_12345` with 30d expiry | Valid signature, payload contains user ID | **PASS** |
| `Generate short-lived OTP token` | Verify OTP expiration | User ID + 10m expiry | Valid signature with `isOtp: true` payload | **PASS** |
| `Reject expired or malformed JWT` | Verify tampering defense | Malformed token string `bad.token.signature` | `jwt.verify` throws signature error | **PASS** |

#### Suite 3: Resume Processing & JD Matching Logic ([`SERVER/tests/resume.test.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/SERVER/tests/resume.test.js))
| Test Case | Objective | Input / Scenario | Expected Outcome | Result |
| :--- | :--- | :--- | :--- | :---: |
| `Reject unsupported file types` | Prevent malicious upload | Filename `exploit.exe`, MIME `application/x-msdownload` | Rejection error: `Only PDF and DOCX files are allowed` | **PASS** |
| `Match skills against JD & score` | Validate matching engine | Candidate: React, Node. JD: React, Node, Docker | Computed match % score, matched skills, missing skills | **PASS** |

#### Suite 4: Backend Security Hardening & Middleware ([`SERVER/tests/security.test.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/SERVER/tests/security.test.js))
| Test Case | Objective | Input / Scenario | Expected Outcome | Result |
| :--- | :--- | :--- | :--- | :---: |
| `Attach security headers & X-Request-Id` | Verify defensive headers | Any incoming HTTP request | Headers: `nosniff`, `DENY`, `HSTS`, `X-Request-Id` | **PASS** |
| `Reject unauthenticated in AuthProtect` | Verify route protection | Request without cookie or Authorization header | HTTP 401 Unauthorized | **PASS** |
| `Extract bearer token from header` | Verify dual auth compatibility | Header `Authorization: Bearer <validToken>` | Successfully identifies user from Bearer header | **PASS** |

---

### 3.2 Frontend Test Suites (`CLIENT`)

#### Suite 5: Frontend Auth & Storage Integrity ([`CLIENT/tests/auth.test.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/CLIENT/tests/auth.test.js))
| Test Case | Objective | Input / Scenario | Expected Outcome | Result |
| :--- | :--- | :--- | :--- | :---: |
| `Safely store & parse user in localStorage` | Verify token/user persistence | User object `{ id: '1', email: 'test@example.com' }` | Correct JSON serialization and parsing | **PASS** |
| `Purge user credentials on logout` | Prevent credential lingering | Logout invocation | `user` and `token` removed from storage | **PASS** |

#### Suite 6: Frontend Client Validation Rules ([`CLIENT/tests/validation.test.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/CLIENT/tests/validation.test.js))
| Test Case | Objective | Input / Scenario | Expected Outcome | Result |
| :--- | :--- | :--- | :--- | :---: |
| `Validate well-formed email addresses` | Form input verification | Valid vs. malformed email strings | Rejects invalid, accepts valid | **PASS** |
| `Enforce password length >= 6` | Password policy | Password strings < 6 characters | Rejects weak, accepts compliant | **PASS** |
| `Enforce PDF/DOCX and 5MB size limit` | File upload guard | File extensions & sizes > 5,242,880 bytes | Flags non-PDF/DOCX and oversize files | **PASS** |

---

## 4. Execution Output Log

The following is the direct command-line output from the automated test run:

```text
> careernova-ai@1.0.0 test
> npm test --prefix SERVER && npm test --prefix CLIENT

> server@1.0.0 test
> node --test tests/*.test.js

◇ injected env (11) from .env
▶ API Quality, Health Checks & Observability Endpoints
  ✔ GET /health should return 200 with operational metrics (2.658ms)
  ✔ GET /health/ready should report database status (0.443ms)
  ✔ GET /api/non-existent-route should return structured 404 error (0.4627ms)
  ✔ POST /api/feedback should reject requests missing required fields (0.4243ms)
✔ API Quality, Health Checks & Observability Endpoints (4.7114ms)

▶ Backend Auth Service & Token Lifecycle
  ✔ should hash passwords securely with bcrypt work factor >= 10 (163.5318ms)
  ✔ should generate a valid JWT token with user id payload (2.6854ms)
  ✔ should generate a short-lived OTP token with kitkat cookie (0.5427ms)
  ✔ should reject expired or malformed JWT tokens (0.3874ms)
✔ Backend Auth Service & Token Lifecycle (168.1903ms)

▶ Resume Processing & JD Matching Logic
  ✔ should reject unsupported file types with a clear error (0.9178ms)
  ✔ should match skills against job description and compute structured scores (0.7888ms)
✔ Resume Processing & JD Matching Logic (2.6341ms)

▶ Backend Security Hardening & Middleware
  ✔ should attach essential security headers (Helmet-equivalent) and X-Request-Id (0.7817ms)
  ✔ should reject unauthenticated requests in AuthProtect middleware with 401 (0.3019ms)
  ✔ should extract bearer token from Authorization header if cookie is missing (0.7431ms)
✔ Backend Security Hardening & Middleware (2.5908ms)

ℹ tests 13
ℹ suites 4
ℹ pass 13
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 923.2013

> client@0.0.0 test
> node --test tests/*.test.js

▶ Frontend Auth & Storage Integrity
  ✔ should safely store and parse user profile in localStorage (0.6206ms)
  ✔ should purge user credentials from storage on logout (0.1892ms)
✔ Frontend Auth & Storage Integrity (1.4978ms)

▶ Frontend Client Validation Rules
  ✔ should validate well-formed email addresses (0.5868ms)
  ✔ should enforce minimum password length of 6 characters (0.1145ms)
  ✔ should enforce PDF/DOCX file extension and 5MB size restrictions (0.2383ms)
✔ Frontend Client Validation Rules (1.726ms)

ℹ tests 5
ℹ suites 2
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 75.7082
```

---

## 5. Continuous Testing Pipeline

These tests are integrated into the root GitHub Actions workflow ([`.github/workflows/ci.yml`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/.github/workflows/ci.yml)). Any push or pull request to `main` automatically triggers:
1. `npm run lint` across all subprojects.
2. `npm test` across all subprojects.
3. `npm run build` on the client application.
Failure of any test halts the pipeline and blocks deployment.


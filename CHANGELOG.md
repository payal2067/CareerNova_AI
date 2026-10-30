# Changelog — CareerNova_AI

All notable changes to the CareerNova_AI enterprise platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — Enterprise Quality & Security Audit Release (2026-10-30)

### 🚀 Architecture & Monorepo
* **Root Workspace Standardization**: Added root `package.json` with unified workspace scripts (`lint`, `test`, `build`, `start`, `format:check`).
* **Environment Configuration**: Created standardized `SERVER/.env.example` and `CLIENT/.env.example` templates with explicit variable keys and removed malformed whitespace around secrets.
* **Server Bootstrap Lifecycle**: Separated Express app creation from port listening in `SERVER/index.js`, allowing programmatic test imports without hanging process exit.
* **Graceful Process Termination**: Implemented `SIGINT` and `SIGTERM` listeners in `SERVER/index.js` to ensure clean database disconnection on container shutdowns.
* **Observability Endpoints**: Added public `/health` and `/health/ready` endpoints to monitor process uptime, memory consumption, and live MongoDB connection state.
* **Standardized Error Responses**: Created unified error handling middleware producing structured error JSON `{ success: false, error: { code, message, requestId, timestamp } }` and stripping internal stack traces in production.

### 🔒 Security Hardening & Vulnerability Remediation
* **IDOR Elimination**: Added user ownership verification checks (`session.userId.toString() === req.user._id.toString()`) across `evaluateAnswer`, `submitAnswers`, and `getSessionById` in `SERVER/src/controller/interviewSimController.js`.
* **Parameter Validation**: Added `mongoose.Types.ObjectId.isValid` input guards on all session and user identifier parameters.
* **Dual Authentication**: Updated `SERVER/src/middleware/authMiddleware.js` to inspect both HTTP cookies (`Oreo`, `kitkat`) and incoming `Authorization: Bearer <token>` headers.
* **Axios Bearer Interceptor**: Configured Axios request interceptor in `CLIENT/src/config/ApiConfig.jsx` to sign outbound requests with bearer tokens and purge stale localStorage sessions upon 401 response.
* **Rate Limiting**: Implemented high-performance in-memory sliding window rate limiters in `SERVER/src/middleware/securityMiddleware.js`:
  - `authLimiter`: 25 requests per 15 minutes per IP on `/api/auth/*` routes.
  - `apiLimiter`: 300 requests per 15 minutes per IP on general routes.
* **Defensive HTTP Headers**: Added Helmet-grade security headers (`nosniff`, `DENY`, `HSTS`, `X-Request-Id`).
* **Session Purge on Password Reset**: Added automatic cookie clearing (`res.clearCookie`) on password resets to invalidate existing sessions across credentials changes.
* **Secure Change Password Endpoint**: Added authenticated `PATCH /api/auth/change-password` controller and route with current password verification.
* **Upload Restrictions**: Enforced 5MB size limit and strict PDF/DOCX MIME type validation in `SERVER/src/middleware/multer.js`.

### ⚛️ Frontend Quality & React 19 Compliance
* **Zero ESLint Errors**: Resolved all 61 ESLint violations across client and server components.
* **React 19 Hooks Purity**: Hoisted `calculateElapsedTime` out of `CLIENT/src/pages/Interview.jsx` component render to eliminate `Date.now()` impure render errors.
* **Ref Lifecycle Safety**: Encapsulated camera ref mutations (`videoRef.current = video`) inside dedicated `useEffect` hooks with clean teardown.
* **Lazy Context Initialization**: Converted `CLIENT/src/context/AuthContext.jsx` from synchronous `useEffect` set-state to lazy `useState(() => getStoredUser())` initializers, preventing flash of unauthenticated layout and cascading re-renders.
* **Class Error Boundary**: Created `CLIENT/src/components/ErrorBoundary.jsx` and wrapped application route tree to prevent white-screen crashes on uncaught runtime errors.
* **Custom 404 Route**: Implemented themed `CLIENT/src/pages/NotFound.jsx` and added wildcard route `<Route path="*" element={<NotFound />} />` in `App.jsx`.
* **Component Standardization**: Replaced misspelled `PasswordChangleModal.jsx` with `PasswordChangeModal.jsx` and connected to live password change API.
* **Dead Code Pruning**: Eliminated unused icons, dead state declarations, and legacy JSX runtime imports across all pages.

### 🛡 Backend Resilience & Fallback Parsers
* **ESM PDF Parser Crash Fix**: Resolved `ENOENT` debug crash by switching import in `SERVER/src/utils/parseResume.js` directly to `pdf-parse/lib/pdf-parse.js`.
* **Gemini Model Upgrade**: Upgraded AI model identifier to `gemini-2.5-flash` with configurable fallback from `process.env.GEMINI_MODEL`.
* **Local Heuristic Resume Parser**: Added local regex extractor fallback for name, email, phone, skills, experience, and education when AI API is unavailable.
* **Local Heuristic JD Matcher**: Added rule-based keyword overlap matcher in `SERVER/src/utils/matchJD.js` calculating dynamic match percentages, skill intersections, and recommendations without remote API dependencies.
* **Schema Flexibility**: Removed strict `required: true` constraint on `jobDescription` in `SERVER/src/models/resume.model.js` to allow standalone ATS scans without target job descriptions.

### ⚡ Database Performance & Optimization
* **Compound Index on Interview Sessions**: Added `{ userId: 1, createdAt: -1 }` and `{ userId: 1, status: 1 }` to `SERVER/src/models/InterviewSession.js`.
* **Compound Index on Resume Scans**: Added `{ userId: 1, createdAt: -1 }` to `SERVER/src/models/resume.model.js`.
* **Elimination of COLLSCAN**: Converted historical candidate queries from full collection scans to logarithmic index scans (`IXSCAN`).

### 🧪 Automated Testing & CI/CD Pipeline
* **Node.js Native Test Runner**: Configured fast, zero-external-dependency test runner using `node:test` and `node:assert/strict`.
* **Backend Test Suite (13 tests)**:
  - `SERVER/tests/api.test.js`: Health checks, readiness probe, 404 handler, and feedback input validation.
  - `SERVER/tests/auth.test.js`: Bcrypt hashing work factor, JWT signing, and expired token rejection.
  - `SERVER/tests/resume.test.js`: File type whitelist and JD matching logic.
  - `SERVER/tests/security.test.js`: Defensive HTTP headers and dual auth Bearer header resolution.
* **Frontend Test Suite (5 tests)**:
  - `CLIENT/tests/auth.test.js`: LocalStorage serialization and logout credential purge.
  - `CLIENT/tests/validation.test.js`: Email format, password length (>= 6), and file upload constraints.
* **GitHub Actions Pipeline**: Configured `.github/workflows/ci.yml` running linting, automated tests, and client build on push and pull requests to `main`.

### 📚 Comprehensive Documentation Suite
* Created `CAREERNOVA_CHECKLIST.md` (36-point enterprise compliance status).
* Created `CAREERNOVA_AUDIT_REPORT.md` (comprehensive architectural and code quality audit).
* Created `SECURITY_AUDIT.md` (OWASP Top 10 threat model and IDOR mitigations).
* Created `PERFORMANCE_REPORT.md` (bundle size analysis, query plans, latency).
* Created `TESTING_REPORT.md` (test architecture, coverage, and execution logs).
* Created `DEPLOYMENT_GUIDE.md` (production runbook for PM2, Nginx, Vercel, and MongoDB Atlas).
* Updated root `README.md`, `CLIENT/README.md`, and created `SERVER/README.md`.


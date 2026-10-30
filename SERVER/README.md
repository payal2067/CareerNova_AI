# 🛠 CareerNova_AI — Backend API Server

**Runtime**: Node.js 20+  
**Framework**: Express 5.2  
**Database**: MongoDB Atlas via Mongoose 9  
**Security**: Dual Auth (JWT Cookies + Bearer), Helmet-Equivalent Security Headers, Sliding Window Rate Limiting, IDOR Mitigations

---

## 1. Architecture Overview

The `SERVER` subproject provides a stateless, scalable REST API supporting authentication, resume parsing, job description matching, candidate analytics, and adaptive AI mock interviews.

```
SERVER/
├── src/
│   ├── config/
│   │   ├── db.js                    # MongoDB Atlas connection with retry handling
│   │   └── mail.js                  # Nodemailer transporter for OTP verification emails
│   ├── controller/
│   │   ├── auth.controller.js       # Register, Login, Logout, OTP, Forgot/Reset/Change Password
│   │   ├── feedback.controller.js   # User feedback submission handler
│   │   ├── interviewSimController.js# Mock interview sessions, evaluation, IDOR-guarded queries
│   │   └── resume.controller.js     # Resume upload, parsing, and JD alignment
│   ├── middleware/
│   │   ├── authMiddleware.js        # Dual authentication (Cookie + Bearer header)
│   │   ├── multer.js                # Multipart file upload handler (PDF/DOCX, 5MB limit)
│   │   └── securityMiddleware.js    # Security headers, X-Request-Id, and sliding window rate limiting
│   ├── models/
│   │   ├── feedback.model.js        # User feedback schema
│   │   ├── InterviewSession.js      # Mock interview session schema with compound indexes
│   │   ├── resume.model.js          # ATS scan records schema with compound indexes
│   │   └── user.model.js            # User profile, credentials, and OTP metadata schema
│   ├── router/
│   │   ├── ai.route.js              # AI bullet rewriter and match routes
│   │   ├── auth.route.js            # Authentication endpoints with AuthLimiter
│   │   ├── feedback.route.js        # Feedback endpoint
│   │   ├── interviewSim.route.js    # Protected mock interview endpoints
│   │   └── resume.route.js          # Resume upload and JD alignment endpoints
│   └── utils/
│       ├── matchJD.js               # Semantic JD matching with local fallback
│       ├── parseResume.js           # PDF/DOCX text extractor with local regex fallback
│       └── prompt.js                # Prompt templates for Gemini AI
├── tests/
│   ├── api.test.js                  # Health checks, 404, and feedback route tests
│   ├── auth.test.js                 # Bcrypt hashing, token signing, and expiration tests
│   ├── resume.test.js               # File validation and JD matching logic tests
│   └── security.test.js             # Security headers and dual authentication tests
├── .env.example                     # Environment template
├── index.js                         # Application configuration, error handler & server bootstrap
└── package.json                     # Backend dependencies & npm scripts
```

---

## 2. API Endpoints Reference

### 2.1 Health & Observability (Public)
* `GET /health` — Returns application uptime, memory usage, environment, and timestamp.
* `GET /health/ready` — Returns 200 if MongoDB is connected (`readyState: 1`), 503 if disconnected.

### 2.2 Authentication & Profile (`/api/auth`)
* `POST /api/auth/register` — Registers new candidate, hashes password with bcrypt, and sends OTP.
* `POST /api/auth/login` — Authenticates credentials, issues JWT via HTTP cookie (`Oreo`) and response JSON.
* `POST /api/auth/logout` — Clears authentication cookies.
* `POST /api/auth/verify-otp` — Verifies 6-digit email OTP.
* `POST /api/auth/forgot-password` — Dispatches reset OTP email.
* `POST /api/auth/reset-password` — Validates OTP and updates password.
* `PATCH /api/auth/change-password` *(Protected)* — Updates password for authenticated user.

### 2.3 Resumes & AI Analysis (`/api/resume` & `/api/ai`)
* `POST /api/resume/upload` *(Protected)* — Uploads `.pdf`/`.docx` (max 5MB), extracts text, and generates ATS analysis.
* `POST /api/ai/match-jd` *(Protected)* — Compares candidate resume with job description and returns gap analysis.
* `POST /api/ai/bullet-rewrite` *(Protected)* — Rewrites weak resume bullet points with action verbs and quantifiable metrics.
* `GET /api/ai/history` *(Protected)* — Retrieves past resume analyses for authenticated user.

### 2.4 Mock Interviews (`/api/interview`)
* `POST /api/interview/start` *(Protected)* — Initializes an adaptive mock interview session.
* `POST /api/interview/evaluate` *(Protected)* — Evaluates candidate answer for a specific question with IDOR ownership validation.
* `POST /api/interview/submit` *(Protected)* — Finalizes mock interview session and computes overall rating with IDOR check.
* `GET /api/interview/session/:id` *(Protected)* — Retrieves session details with IDOR ownership guard.
* `GET /api/interview/history` *(Protected)* — Retrieves chronological interview history for current user using compound index `{ userId: 1, createdAt: -1 }`.

---

## 3. Security Architecture

1. **Dual Authentication Support**:
   - Accepts session JWTs from both `req.cookies.Oreo` and `Authorization: Bearer <token>` headers.
2. **Rate Limiting**:
   - `authLimiter`: Max 25 requests per 15 minutes per IP on `/api/auth/*` routes.
   - `apiLimiter`: Max 300 requests per 15 minutes per IP across all general routes.
3. **Insecure Direct Object Reference (IDOR) Defense**:
   - Every interview session query enforces `session.userId.toString() === req.user._id.toString()`.
4. **Defensive HTTP Headers**:
   - Injected on every response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-Request-Id`.
5. **Sanitized Error Responses**:
   - Internal stack traces are stripped in production, returning structured error JSON:
     ```json
     {
       "success": false,
       "error": {
         "code": "BAD_REQUEST",
         "message": "Validation failed",
         "requestId": "req_1730300000000_abc",
         "timestamp": "2026-10-30T17:10:00.000Z"
       }
     }
     ```

---

## 4. Scripts & Testing

```bash
# Start backend in development mode with nodemon
npm run dev

# Start backend in production mode
npm start

# Run ESLint (0 errors, 0 warnings)
npm run lint

# Run all 13 backend unit and integration tests
npm test
```


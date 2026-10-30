# 🚀 CareerNova_AI — Enterprise AI Career Accelerator & Mock Interview Platform

<div align="center">

![CareerNova_AI Banner](https://img.shields.io/badge/CareerNova_AI-Enterprise%20Platform-6366f1?style=for-the-badge&logo=rocket)
![Tests](https://img.shields.io/badge/Tests-18%2F18%20Passing-brightgreen?style=for-the-badge&logo=checkmarx)
![ESLint](https://img.shields.io/badge/ESLint-0%20Errors%200%20Warnings-success?style=for-the-badge&logo=eslint)
![React 19](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react)
![Vite 8](https://img.shields.io/badge/Vite-8.2-646cff?style=for-the-badge&logo=vite)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.3-38bdf8?style=for-the-badge&logo=tailwindcss)
![Node.js](https://img.shields.io/badge/Node.js-v20-339933?style=for-the-badge&logo=nodedotjs)
![Express 5](https://img.shields.io/badge/Express-v5.2-000000?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248?style=for-the-badge&logo=mongodb)
![Google Gemini AI](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-8e44ad?style=for-the-badge&logo=google)

</div>

---

## 📌 Overview

**CareerNova_AI** is a production-grade, enterprise-ready full-stack AI career platform designed to accelerate candidate job readiness and maximize interview success rates.

Built using the MERN stack with a glassmorphism design system, CareerNova_AI integrates Google Gemini AI with local heuristic resilience to deliver:
- **Real-Time ATS Resume Alignment**: Deep semantic comparison of resumes against target job descriptions with radial score meters and missing skill gap breakdowns.
- **AI Mock Interview Room (Coach Ava)**: Live adaptive mock interview simulations featuring speech-to-text (STT), text-to-speech (TTS), and vision AI proctoring (head pose eye tracking, phone detection, and multi-person detection).
- **AI Bullet Point Re-Engineering**: Transforms weak resume experience bullets into quantified, metric-driven achievements.
- **Enterprise Security Architecture**: Dual authentication (HTTP cookies + Bearer tokens), IDOR-guarded endpoints, Helmet-grade security headers, sliding window rate-limiting, and sanitized error responses.

---

## 🏗 System Architecture

```
                       ┌────────────────────────────────────────────────────────┐
                       │                   CAREERNOVA CLIENT                    │
                       │   (React 19 + Vite 8 + Tailwind v4 + Speech/Vision)    │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                                                   │ HTTP / REST (JWT Bearer / Cookie)
                                                   ▼
                       ┌────────────────────────────────────────────────────────┐
                       │                  EXPRESS 5 API GATEWAY                 │
                       │   Security Headers | Rate Limiting | Dual Auth Guard   │
                       └─────────────┬────────────────────────────┬─────────────┘
                                     │                            │
             Async Mongoose Schemas  │                            │  Google Gemini 2.5 Flash
             Compound Indexes (IXSCAN)│                           │  + Local Heuristic Fallback
                                     ▼                            ▼
                       ┌─────────────────────────┐  ┌───────────────────────────┐
                       │      MONGODB ATLAS      │  │     GOOGLE GEMINI AI      │
                       │  Users, Resumes, History│  │  Generative Intelligence  │
                       └─────────────────────────┘  └───────────────────────────┘
```

---

## ✨ Core Platform Capabilities

### 📄 1. ATS Resume Parsing & Semantic Keyword Matcher
* Supports `.pdf` and `.docx` document uploads with strict MIME and file size validation (5MB).
* Combines Google Gemini Generative AI with automated local regex and heuristic overlap fallback engines.
* Generates matched skills, missing skills, categorized readiness ratings, and concrete improvement advice.

### 🎙 2. Adaptive Mock Interview Simulation (Coach Ava)
* **Text Mode**: Focuses on structured coding and technical responses.
* **Voice Mode**: Live bidirectional Speech-to-Text (STT) and AI voice synthesis (TTS) with verbal confidence scoring.
* **Vision Proctoring Mode**: TensorFlow.js / `coco-ssd` and `face-api.js` tracking eye contact, secondary persons, and mobile phone usage.
* Protected against **Insecure Direct Object Reference (IDOR)** with user ownership checks on session updates and evaluation retrieval.

### 📊 3. Candidate Analytics & PDF Export
* Chronological Recharts visualization of candidate score progression over time.
* Client-side PDF export with `html2pdf.js` for offline review.

### 🛡 4. Enterprise Security & Observability
* Dual authentication architecture compatible with browser localStorage and secure HTTP cookies.
* Helmet-equivalent defensive HTTP headers (`nosniff`, `DENY`, `HSTS`, `X-Request-Id`).
* In-memory sliding window rate-limiting: 25 requests/15m for authentication, 300 requests/15m for general APIs.
* Native health probes (`/health`, `/health/ready`) with uptime, memory, and database status reporting.

---

## 🛠 Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, FlyonUI, Recharts, React Router DOM v7 |
| **Backend** | Node.js 20, Express 5, Multer, `pdf-parse`, `mammoth`, Nodemailer |
| **Database** | MongoDB Atlas, Mongoose 9 ODM (with compound indexing) |
| **AI & ML** | Google Gemini AI (`gemini-2.5-flash`), TensorFlow.js, COCO-SSD, Face-API.js |
| **Testing** | Node.js Native Test Runner (`node:test`, `node:assert/strict`) — 18/18 passing |
| **CI / CD** | GitHub Actions (`.github/workflows/ci.yml`), ESLint |

---

## 📁 Repository Structure

```
CareerNovaAI/
├── .github/
│   └── workflows/
│       └── ci.yml                   # CI/CD Pipeline (Lint, Test, Build)
├── CLIENT/                          # React 19 Frontend Application
│   ├── src/
│   │   ├── components/              # UI Components, Modals, and ErrorBoundary
│   │   ├── config/                  # Axios instance with Bearer interceptor
│   │   ├── context/                 # AuthContext & ThemeContext
│   │   ├── pages/                   # Home, Dashboard, Interview, Analyze, NotFound
│   │   ├── App.jsx                  # Application Routes & Error Boundary
│   │   └── main.jsx                 # Client entry point
│   ├── tests/                       # Frontend validation tests
│   ├── package.json                 # Client dependencies & scripts
│   └── vite.config.js               # Vite 8 build configuration
├── SERVER/                          # Express 5 Backend API
│   ├── src/
│   │   ├── config/                  # MongoDB & Nodemailer configuration
│   │   ├── controller/              # Auth, Resume, AI, and Interview controllers
│   │   ├── middleware/              # AuthProtect, Security Headers, Rate Limiting
│   │   ├── models/                  # User, Resume, and InterviewSession schemas
│   │   ├── router/                  # REST route definitions
│   │   └── utils/                   # Gemini AI prompts, PDF parsers, JD matchers
│   ├── tests/                       # Backend unit and integration tests
│   ├── index.js                     # Express app configuration & server startup
│   └── package.json                 # Backend dependencies & scripts
├── docs/                            # Comprehensive Documentation & Audit Reports
│   ├── CAREERNOVA_CHECKLIST.md      # 36-Point Enterprise Quality Checklist
│   ├── CAREERNOVA_AUDIT_REPORT.md   # Comprehensive Architecture Audit Report
│   ├── SECURITY_AUDIT.md            # OWASP Top 10 Security Audit
│   ├── SECURITY_CHECKLIST.md        # Enterprise Security Checklist
│   ├── SECURITY_FIXES.md            # Security Fixes & Technical Log
│   ├── SECURITY_TEST_REPORT.md      # Security Test Execution Report
│   ├── PERFORMANCE_REPORT.md        # Bundle Size & Latency Analysis
│   ├── TESTING_REPORT.md            # Test Suite Results & Coverage
│   ├── DEPLOYMENT_GUIDE.md          # Production Deployment & Ops Runbook
│   └── api-documentation.md         # REST API Endpoint Specifications
├── README.md                        # Master Project Documentation
└── CHANGELOG.md                     # Detailed Engineering Changelog
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js**: v20.x or higher
* **npm**: v10.x or higher
* **MongoDB**: Active MongoDB Atlas URI or local instance

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-org/CareerNova_AI.git
cd CareerNovaAI

# Install monorepo dependencies
npm install
cd CLIENT && npm install
cd ../SERVER && npm install
cd ..
```

### 2. Configure Environment Variables
* Configure backend settings in `SERVER/.env` (see `SERVER/.env.example`):
  ```env
  PORT=4500
  NODE_ENV=development
  MONGO_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/careernova
  JWT_SECRET=your_super_secret_jwt_key
  CLIENT_URL=http://localhost:5173
  EMAIL=your_email@gmail.com
  EMAIL_PASSWORD=your_app_password
  GEMINI_API_KEY=your_gemini_api_key
  GEMINI_MODEL=gemini-2.5-flash
  ```
* Configure frontend settings in `CLIENT/.env` (see `CLIENT/.env.example`):
  ```env
  VITE_API_URL=http://localhost:4500
  ```

### 3. Run Quality Verification & Tests
```bash
# Run linting across the monorepo (0 errors, 0 warnings)
npm run lint

# Run all 18 automated tests
npm test

# Build client production bundle (277 kB gzipped)
npm run build
```

### 4. Start Development Servers
* **Backend API**:
  ```bash
  cd SERVER
  npm run dev   # Starts Express server on http://localhost:4500
  ```
* **Frontend Client**:
  ```bash
  cd CLIENT
  npm run dev   # Starts Vite dev server on http://localhost:5173
  ```

---

## 📊 Comprehensive Audit & Quality Reports

The codebase has undergone a full enterprise audit adhering to the 36-point standard. All detailed documentation is organized in the [`docs/`](docs/) directory:
* [36-Point Enterprise Checklist](docs/CAREERNOVA_CHECKLIST.md)
* [Comprehensive Architecture Audit Report](docs/CAREERNOVA_AUDIT_REPORT.md)
* [Security & OWASP Top 10 Audit](docs/SECURITY_AUDIT.md)
* [Enterprise Security Checklist](docs/SECURITY_CHECKLIST.md)
* [Security Fixes & Technical Log](docs/SECURITY_FIXES.md)
* [Security Test Execution Report](docs/SECURITY_TEST_REPORT.md)
* [Performance & Optimization Report](docs/PERFORMANCE_REPORT.md)
* [Testing & Quality Verification Report](docs/TESTING_REPORT.md)
* [Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
* [REST API Documentation](docs/api-documentation.md)
* [Changelog](CHANGELOG.md)

---

## 📜 License & Compliance

Licensed under the MIT License. Developed for enterprise-grade scalability, security, and developer productivity.

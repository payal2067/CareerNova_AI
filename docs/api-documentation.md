# 📡 PrepOrbit — API Documentation

Welcome to the **PrepOrbit** API documentation. This document details all available RESTful API endpoints, request payload schemas, headers, authentication mechanisms, and sample responses.

---

## 🌐 Base URL & Protocol

- **Local Server Base URL**: `http://localhost:4500/api`
- **Protocol**: HTTP / HTTPS
- **Data Format**: `application/json` (unless specifying `multipart/form-data` for file uploads)

---

## 🔐 Authentication & Authorization

Most protected routes require authentication via **JWT (JSON Web Token)**.

### Headers Scheme
```http
Authorization: Bearer <your_jwt_token>
```
Alternatively, tokens are automatically read from HTTP-Only Cookies named `Oreo` or `token`.

---

## 📚 Table of Contents

1. [Authentication Endpoints (`/api/auth`)](#1-authentication-endpoints-apiauth)
2. [Resume & JD Match Engine (`/api/resume`)](#2-resume--jd-match-engine-apiresume)
3. [AI Analysis & Bullet Rewriter (`/api/ai`)](#3-ai-analysis--bullet-rewriter-api-api-ai)
4. [Mock Interview Simulation (`/api/interview`)](#4-mock-interview-simulation-apiinterview)
5. [Feedback & Ratings (`/api/feedback`)](#5-feedback--ratings-apifeedback)

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register User
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "_id": "66bc8a12e3...",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

---

### 1.2 Login User
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "_id": "66bc8a12e3...",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

---

### 1.3 Get Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Access**: Protected (Requires JWT)
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "_id": "66bc8a12e3...",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

---

### 1.4 Logout User
- **Endpoint**: `POST /api/auth/logout`
- **Access**: Public / Protected
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 1.5 Password Reset Flow

#### Send OTP
- **Endpoint**: `POST /api/auth/send-otp`
- **Body**: `{ "email": "jane@example.com" }`

#### Verify OTP
- **Endpoint**: `POST /api/auth/verify-otp`
- **Body**: `{ "email": "jane@example.com", "otp": "123456" }`

#### Reset Password
- **Endpoint**: `POST /api/auth/reset-password`
- **Access**: OTP Protected
- **Body**: `{ "newPassword": "NewSecurePassword123!" }`

---

## 2. Resume & JD Match Engine (`/api/resume`)

### 2.1 Upload Resume & Match Job Description
- **Endpoint**: `POST /api/resume/upload`
- **Access**: Public / Optional JWT Auth
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `resume`: File (`.pdf` or `.docx`, Max 5MB)
  - `job_description`: String (Optional job description text)
- **Success Response (200 OK)**:
```json
{
  "parsedResume": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1 234 567 8900",
    "skills": ["React.js", "Node.js", "MongoDB", "TypeScript"],
    "experience": [
      {
        "title": "Software Engineer",
        "company": "Tech Corp",
        "duration": "2022 - Present"
      }
    ],
    "projects": ["PrepOrbit Platform", "E-Commerce Suite"]
  },
  "matchResult": {
    "match_score": 85,
    "matched_keywords": ["React.js", "Node.js", "TypeScript"],
    "missing_keywords": ["Docker", "GraphQL", "AWS"],
    "job_suitability": "Strong Candidate Match",
    "actionable_suggestions": [
      "Add experience with cloud deployment (AWS/GCP).",
      "Highlight GraphQL query optimization in past projects."
    ]
  },
  "savedRecordId": "66bc9ef12a..."
}
```

---

## 3. AI Analysis & Bullet Rewriter API (`/api/ai`)

### 3.1 Direct Resume Text Analysis
- **Endpoint**: `POST /api/ai/analyze`
- **Access**: Protected
- **Request Body**:
```json
{
  "resumeText": "Experienced Full Stack Developer with strong React and Node.js skills...",
  "targetRole": "Fullstack Engineer"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "targetRole": "Fullstack Engineer",
    "finalStrengthScore": 82,
    "extractedSkills": ["React", "Node.js", "Express"],
    "missingSkills": ["Docker", "Redis"],
    "weakTopics": ["System Design Architecture"],
    "analysisReport": "Strong foundational profile with modern web stack skills."
  }
}
```

---

### 3.2 AI Resume Bullet Points Rewriter
- **Endpoint**: `POST /api/ai/rewrite-bullet`
- **Access**: Public / Protected
- **Request Body**:
```json
{
  "bulletPoint": "Worked on website speed and built React components for user dashboard.",
  "targetRole": "Frontend Engineer",
  "jobDescription": "Looking for React developer with Web Vitals optimization experience."
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "improvedBullets": [
    "Architected high-performance React dashboard components, improving Google Core Web Vitals score by 35%.",
    "Spearheaded web performance optimization initiatives, reducing initial page load latency from 3.2s to 1.1s.",
    "Engineered scalable modular UI components in React, boosting dashboard user interaction rates by 25%."
  ]
}
```

---

### 3.3 Get Resume Analysis History
- **Endpoint**: `GET /api/ai/history`
- **Access**: Protected
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "history": [
    {
      "_id": "66bc9ef12a...",
      "targetRole": "Frontend Engineer",
      "finalStrengthScore": 85,
      "createdAt": "2026-08-14T12:00:00.000Z"
    }
  ]
}
```

---

## 4. Mock Interview Simulation (`/api/interview`)

### 4.1 Start Interview Session
- **Endpoint**: `POST /api/interview/start`
- **Access**: Protected
- **Request Body**:
```json
{
  "role": "Frontend Engineer",
  "experience": "Mid-Level (2-5 yrs)",
  "mode": "voice",
  "extractedSkills": ["React", "TypeScript", "Tailwind CSS"],
  "missingKeywords": ["GraphQL", "Jest"]
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "sessionId": "66bca1209b...",
  "questions": [
    {
      "id": 1,
      "question": "Can you explain how React's Virtual DOM reconciliation process works?",
      "category": "Technical",
      "hint": "Focus on diffing algorithm and fiber architecture."
    },
    {
      "id": 2,
      "question": "Tell me about a time you had to optimize a slow-performing web application.",
      "category": "Behavioral",
      "hint": "Use the STAR method."
    }
  ]
}
```

---

### 4.2 Evaluate Individual Answer
- **Endpoint**: `POST /api/interview/evaluate`
- **Access**: Protected
- **Request Body**:
```json
{
  "sessionId": "66bca1209b...",
  "questionId": 1,
  "userAnswer": "Virtual DOM is a lightweight copy of the real DOM. React compares the old and new virtual DOM using diffing algorithm and only updates changed nodes."
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "evaluation": {
    "score": 90,
    "feedback": "Excellent explanation of virtual DOM diffing concepts. Mentioning React Fiber would make it complete.",
    "keyTakeaways": ["Good technical clarity", "Clear concise answer"],
    "idealAnswer": "React uses a virtual representation of the UI kept in memory. During reconciliation, React Fiber compares trees in O(n) time and batches updates efficiently."
  }
}
```

---

### 4.3 Submit Full Interview & Generate Report
- **Endpoint**: `POST /api/interview/submit`
- **Access**: Protected
- **Request Body**:
```json
{
  "sessionId": "66bca1209b...",
  "answers": [
    { "questionId": 1, "userAnswer": "Virtual DOM diffing..." },
    { "questionId": 2, "userAnswer": "I optimized bundle size using code splitting..." }
  ],
  "proctoringLogs": {
    "fullscreenViolations": 0,
    "objectDetections": []
  }
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "report": {
    "sessionId": "66bca1209b...",
    "overallScore": 88,
    "performanceSummary": "Strong technical readiness for Frontend Engineer roles.",
    "strengths": ["Clear communication", "Solid React concepts"],
    "areasForImprovement": ["Elaborate more on testing tools like Jest"],
    "questionEvaluations": [...]
  }
}
```

---

### 4.4 Get User Interview History
- **Endpoint**: `GET /api/interview/history`
- **Access**: Protected
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "sessions": [
    {
      "_id": "66bca1209b...",
      "targetRole": "Frontend Engineer",
      "overallScore": 88,
      "mode": "voice",
      "createdAt": "2026-08-14T14:30:00.000Z"
    }
  ]
}
```

---

### 4.5 Get Session Report By ID
- **Endpoint**: `GET /api/interview/session/:id`
- **Access**: Public / Protected
- **Success Response (200 OK)**: Returns the detailed JSON evaluation report for that mock interview session.

---

## 5. Feedback & Ratings (`/api/feedback`)

### 5.1 Submit Feedback
- **Endpoint**: `POST /api/feedback`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "feedback": "The voice-based mock interview feature felt like a real technical interview!",
  "rating": 5
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Feedback submitted successfully"
}
```

---

## 🛑 Common Error Status Codes

| Code | Meaning | Example Cause |
| :--- | :--- | :--- |
| `400 Bad Request` | Missing required parameters, file too large, unsupported format | Uploading a `.txt` file instead of `.pdf`/`.docx` |
| `401 Unauthorized` | Invalid, expired, or missing JWT token | Calling `/api/interview/start` without logging in |
| `404 Not Found` | Resource ID not found in database | Requesting `/api/interview/session/invalid_id` |
| `500 Server Error` | Backend or external AI API error | Gemini API timeout or key configuration issue |

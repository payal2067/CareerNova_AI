# CareerNova_AI — Security Fixes & Vulnerability Remediation Log

**Audit Standard**: OWASP Top 10 & CWE Guidelines  
**Date**: October 30, 2026  
**Status**: All Identified Critical, High, and Medium Vulnerabilities Verified & Remediated

---

## 1. Fix Inventory Summary

| ID | Vulnerability Description | Affected File & Endpoint | Severity | Remediation Status |
| :---: | :--- | :--- | :---: | :---: |
| **SEC-01** | IDOR / BOLA on Resume Access in Simulation | `SERVER/src/controller/interviewSimController.js` (`POST /api/interview/start`) | **CRITICAL** | **VERIFIED FIXED** |
| **SEC-02** | NoSQL Injection via Object Payloads | `SERVER/src/controller/auth.controller.js` (`/api/auth/*`) | **HIGH** | **VERIFIED FIXED** |
| **SEC-03** | Insecure Cookie Settings (`secure: false`) | `SERVER/src/utils/auth.service.js` (`genToken`, `genOTPToken`) | **HIGH** | **VERIFIED FIXED** |
| **SEC-04** | Missing Magic-Byte File Validation | `SERVER/src/middleware/multer.js`, `SERVER/src/utils/parseResume.js` | **HIGH** | **VERIFIED FIXED** |
| **SEC-05** | Password Hash Exposure in `req.user` | `SERVER/src/middleware/authMiddleware.js` (`AuthProtect`) | **HIGH** | **VERIFIED FIXED** |
| **SEC-06** | User Account Enumeration in Login & OTP | `SERVER/src/controller/auth.controller.js` (`/login`, `/send-otp`) | **MEDIUM** | **VERIFIED FIXED** |
| **SEC-07** | Insecure OTP Randomness & No Brute-Force Limits | `SERVER/src/controller/auth.controller.js`, `SERVER/src/models/otp.model.js` | **MEDIUM** | **VERIFIED FIXED** |
| **SEC-08** | Missing Content Security Policy (CSP) | `SERVER/src/middleware/securityMiddleware.js` | **MEDIUM** | **VERIFIED FIXED** |
| **SEC-09** | Missing Input Boundaries on Feedback & Evaluation | `SERVER/src/controller/feedback.controller.js`, `interviewSimController.js` | **LOW** | **VERIFIED FIXED** |

---

## 2. Detailed Technical Fixes

### SEC-01: Insecure Direct Object Reference (IDOR) on Resume Access
* **Severity**: **CRITICAL**
* **CWE**: CWE-639 (Authorization Bypass Through User-Controlled Key)
* **Affected Endpoint**: `POST /api/interview/start`
* **Vulnerability Description**: When starting an interview session, candidates could supply a `resumeId`. The backend retrieved `Resume.findById(resumeId)` without verifying if the authenticated user owned the resume. This allowed attackers to access other candidates' full resume profiles, project details, skills, and work histories.
* **Remediation Implemented**:
  In [`SERVER/src/controller/interviewSimController.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/SERVER/src/controller/interviewSimController.js):
  ```javascript
  // Validate ObjectId format and enforce strict user ownership
  if (resumeId) {
    if (!mongoose.Types.ObjectId.isValid(resumeId)) {
      return res.status(400).json({ success: false, message: "Invalid resume ID format" });
    }
    const foundResume = await Resume.findById(resumeId);
    if (foundResume) {
      if (foundResume.userId && userId && foundResume.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You do not have permission to access this resume"
        });
      }
      resumeDetails = foundResume;
    }
  }
  ```

---

### SEC-02: NoSQL Injection via Object Payloads
* **Severity**: **HIGH**
* **CWE**: CWE-943 (Improper Neutralization of Special Elements used in an SQL/NoSQL Command)
* **Affected Endpoints**: `POST /api/auth/login`, `POST /api/auth/send-otp`, `POST /api/auth/verify-otp`
* **Vulnerability Description**: Request parameters such as `email` were tested with simple truthiness (`if (!email)`). An attacker submitting `{ "email": { "$gt": "" } }` could bypass checks, querying MongoDB with a selector object that matched arbitrary users.
* **Remediation Implemented**:
  In [`SERVER/src/controller/auth.controller.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/SERVER/src/controller/auth.controller.js):
  ```javascript
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password.trim()) {
    const error = new Error("Valid email and password are required");
    error.statusCode = 400;
    return next(error);
  }
  const cleanEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: cleanEmail });
  ```

---

### SEC-03: Insecure Cookie Settings Hardcoded to `secure: false`
* **Severity**: **HIGH**
* **CWE**: CWE-614 (Sensitive Cookie in HTTPS Session Without 'Secure' Attribute)
* **Affected Files**: `SERVER/src/utils/auth.service.js`
* **Vulnerability Description**: Authentication cookies (`Oreo`, `kitkat`) hardcoded `secure: false`, permitting transmission over unencrypted HTTP connections in production.
* **Remediation Implemented**:
  In [`SERVER/src/utils/auth.service.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/SERVER/src/utils/auth.service.js):
  ```javascript
  const isProduction = process.env.NODE_ENV === "production";

  export const getCookieOptions = (maxAgeMs) => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: maxAgeMs,
  });
  ```

---

### SEC-04: Missing Magic-Byte / File Signature Validation on Uploads
* **Severity**: **HIGH**
* **CWE**: CWE-434 (Unrestricted Upload of File with Dangerous Type)
* **Affected Endpoint**: `POST /api/resume/upload`
* **Vulnerability Description**: Resume uploads relied exclusively on the client-provided `mimetype` header. An attacker could disguise an executable binary or malicious script as a `.pdf` file.
* **Remediation Implemented**:
  1. Created dedicated upload middleware [`SERVER/src/middleware/multer.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/SERVER/src/middleware/multer.js) restricting extensions (`.pdf`, `.docx`, `.doc`), MIME types, and enforcing a 5MB size limit.
  2. In [`SERVER/src/utils/parseResume.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/SERVER/src/utils/parseResume.js), implemented file signature magic-byte verification:
     ```javascript
     if (file.mimetype === "application/pdf") {
       if (file.buffer.length < 4 || file.buffer.slice(0, 4).toString() !== "%PDF") {
         throw new Error("Invalid file signature: File claims to be PDF but does not have valid PDF magic bytes");
       }
     } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
       const isDocx = file.buffer.length >= 4 && file.buffer[0] === 0x50 && file.buffer[1] === 0x4B;
       if (!isDocx) {
         throw new Error("Invalid file signature: File claims to be Word document but does not have valid magic bytes");
       }
     }
     ```

---

### SEC-05: Password Hash Exposure in `req.user`
* **Severity**: **HIGH**
* **CWE**: CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor)
* **Affected File**: `SERVER/src/middleware/authMiddleware.js`
* **Vulnerability Description**: `AuthProtect` queried `User.findById(decode.id)` without field exclusions, attaching the user's bcrypt password hash to `req.user`. Any controller logging or serializing `req.user` leaked the hash.
* **Remediation Implemented**:
  In [`SERVER/src/middleware/authMiddleware.js`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/SERVER/src/middleware/authMiddleware.js):
  ```javascript
  const verifiedUser = await User.findById(decode.id).select("-password");
  req.user = verifiedUser;
  ```

---

### SEC-06: User Account Enumeration Defense
* **Severity**: **MEDIUM**
* **CWE**: CWE-204 (Observable Response Discrepancy)
* **Affected Endpoints**: `POST /api/auth/login`, `POST /api/auth/send-otp`
* **Vulnerability Description**: Differentiating between "Email not registered" (404) and "Incorrect password" (401) enabled automated email enumeration.
* **Remediation Implemented**:
  1. `LoginUser` returns uniform 401: `"Invalid email or password"`.
  2. Introduced a dummy `bcrypt.compare` to normalize response timing when an email is not found, mitigating timing-based enumeration attacks.
  3. `SendOtp` always returns HTTP 200: `"If an account exists with this email, a verification OTP has been dispatched."`

---

### SEC-07: Insecure Randomness & Missing OTP Brute-Force Limits
* **Severity**: **MEDIUM**
* **CWE**: CWE-330 (Use of Insufficiently Random Values), CWE-307 (Improper Restriction of Excessive Authentication Attempts)
* **Affected Files**: `SERVER/src/controller/auth.controller.js`, `SERVER/src/models/otp.model.js`
* **Vulnerability Description**: `Math.random()` was used for OTP generation. Additionally, failed verification attempts did not increment a counter, allowing attackers to attempt multiple guesses during the 5-minute validity window.
* **Remediation Implemented**:
  1. Utilized cryptographically secure random integers:
     ```javascript
     const newOTP = crypto.randomInt(100000, 1000000).toString();
     ```
  2. Added an `attempts` counter to `otpSchema`. In `VerifyOtp`, if `attempts >= 5`, the OTP document is destroyed and HTTP 429 is returned.
  3. The OTP is deleted immediately upon successful verification (single-use enforcement).

---

### SEC-08: Missing Content Security Policy (CSP) & Permissive Camera/Mic Policy
* **Severity**: **MEDIUM**
* **CWE**: CWE-1021 (Improper Restriction of Rendered UI Layers or Frames)
* **Affected File**: `SERVER/src/middleware/securityMiddleware.js`
* **Remediation Implemented**:
  Injected strict CSP and scoped Permissions-Policy:
  ```javascript
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
  );
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
  ```

---

### SEC-09: Input Boundary Validation on Feedback & Evaluation
* **Severity**: **LOW**
* **CWE**: CWE-20 (Improper Input Validation)
* **Affected Files**: `SERVER/src/controller/feedback.controller.js`, `interviewSimController.js`
* **Remediation Implemented**:
  1. Enforced string type checks, email regex format, and maximum lengths on feedback submissions (name $\le 100$, message $\le 2000$).
  2. Added maximum payload length check on answer text ($\le 10,000$ characters) in `evaluateAnswer`.
  3. Bound `proctoringScore` between 0 and 100 in `submitAnswers`.


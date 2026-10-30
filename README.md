# 🪐 PrepOrbit — Next-Gen AI Career Accelerator & Mock Interview Platform

<div align="center">

![PrepOrbit Banner](https://img.shields.io/badge/PrepOrbit-AI%20Career%20Accelerator-6366f1?style=for-the-badge&logo=rocket)
![React 19](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react)
![Vite 8](https://img.shields.io/badge/Vite-8.2-646cff?style=for-the-badge&logo=vite)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.3-38bdf8?style=for-the-badge&logo=tailwindcss)
![Node.js](https://img.shields.io/badge/Node.js-v20-339933?style=for-the-badge&logo=nodedotjs)
![Express 5](https://img.shields.io/badge/Express-v5.2-000000?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248?style=for-the-badge&logo=mongodb)
![Google Gemini AI](https://img.shields.io/badge/Google%20Gemini-AI%20Engine-8e44ad?style=for-the-badge&logo=google)

</div>

---

## 📌 Executive Summary

**PrepOrbit** is a full-stack, enterprise-grade AI career platform designed to accelerate candidate job readiness. Built with a modern **Deep Obsidian** glassmorphism design system, PrepOrbit integrates Google Gemini AI to offer real-time ATS resume alignment, intelligent job description (JD) keyword gap analysis, AI bullet point re-engineering, and interactive roleplay mock interviews with **Coach Ava** featuring speech-to-text, text-to-speech, and vision-AI proctoring (eye-tracking, multi-person detection, and mobile phone detection).

---

## 🏗 System Architecture

![Architecture Diagram](file:///c:/Users/Abhi/Desktop/hackinmotion/HackInMotion-RICR-HIM-1082/architecture-diagram.png)

```
                       +-------------------------------------------------------+
                       |                    PREPORBIT CLIENT                   |
                       |  (React 19 + Vite + Tailwind v4 + Speech/Vision AI)   |
                       +---------------------------+---------------------------+
                                                   |
                                                   | HTTP / REST API (JWT)
                                                   v
                       +-------------------------------------------------------+
                       |                   NODE.JS API GATEWAY                 |
                       |          (Express 5 + Multer + PDF/DOCX Parser)       |
                       +------------+------------------------------+-----------+
                                    |                              |
            Async Mongoose Schemas  |                              |  Gemini AI API Calls
                                    v                              v
                       +------------------------+      +------------------------+
                       |     MONGODB ATLAS      |      |   GOOGLE GEMINI AI     |
                       |  Users, Scans, Logs    |      | Generative Intelligence|
                       +------------------------+      +------------------------+
```

---

## ✨ Key Features

### 📄 1. ATS Resume Alignment & Keyword Scan
* **Client-Side & Server-Side Document Parsing**: Extracts raw text from `.pdf` and `.docx` files seamlessly.
* **Semantic Keyword Matching**: Compares candidate experience against target job descriptions to identify missing technical skills, frameworks, and seniority requirements.
* **ATS Compatibility Score**: Computes a dynamic match percentage using radial SVG meters and categorizes job fit status (*High Relevance*, *Moderate Fit*, *Gap Deficit*).

### 🎙 2. AI Interactive Mock Interview Room (Coach Ava)
* **Multi-Modal Challenge Modes**:
  * ⌨️ **Text Mode**: Standard relaxed question-answering with code block evaluation.
  * 🎙️ **Voice & Tone Mode**: Hands-free real-time Speech-to-Text (STT) and AI voice synthesis (TTS) with verbal confidence assessment.
  * 📹 **Video & Vision Proctoring Mode**: Interactive camera view with live AI proctoring checks.
* **Dynamic AI Coaching**: Powered by Google Gemini AI to continuously generate role-specific questions tailored to missing resume keywords and past candidate answers.

### 👁 3. Live Vision AI Proctoring Engine
* **Face Tracking & Eye Contact**: Utilizes `face-api.js` to track head pose orientation and maintain eye contact scores.
* **Object & Distraction Detection**: Integrated TensorFlow.js / `coco-ssd` model detects unauthorized secondary individuals or cell phone usage during live interviews.
* **Tab-Switch Safeguards**: Live counter alerts candidates upon losing browser window focus.

### ✍️ 4. AI Resume Bullet Point Rewriter
* Takes weak or passive resume experience bullets and rewrites them into high-impact, metrics-driven achievements using action verbs tailored to specific job roles.

### 📊 5. Candidate Dashboard & PDF Export
* **Historical Trend Analysis**: Chronological Recharts visual line graphs tracking performance scores over time.
* **PDF Report Generation**: Instant client-side PDF document downloads for offline review.

### 🔒 6. Security & Authentication
* JWT authentication via HTTP-Only Cookies and Bearer headers.
* Password hashing via `bcrypt` with salt rounds.
* NodeMailer email service with customized HTML OTP verification templates for password reset workflows.

---

## 🛠 Technology Stack

### **Frontend (Client)**
* **Framework**: React 19, React Router DOM v7
* **Build Tool**: Vite 8
* **Styling & Components**: Tailwind CSS v4, FlyonUI (Obsidian Glassmorphism Design System)
* **Data Visualization**: Recharts
* **Icons & Notifications**: React Icons, React Hot Toast
* **AI & Document Libraries**: TensorFlow.js, COCO-SSD, Face-API.js, html2pdf.js, React Markdown

### **Backend (Server)**
* **Runtime & Framework**: Node.js v20, Express 5
* **Database**: MongoDB Atlas via Mongoose 9
* **Authentication**: JSON Web Token (JWT), Bcrypt
* **Document Parsing**: `pdf-parse`, `pdf2json`, `mammoth`
* **File Uploads**: Multer
* **Email Service**: NodeMailer

### **AI Services**
* **Google Gemini AI SDK**: `@google/generative-ai`, `@google-cloud/aiplatform`

---

## 📁 Repository Structure

```
HackInMotion-RICR-HIM-1082/
├── client/                      # React 19 Frontend Application
│   ├── public/                  # Static assets & icons
│   ├── src/
│   │   ├── assets/              # Branding & media assets
│   │   ├── components/          # Reusable UI components (Navbar, Footer, Modals)
│   │   ├── config/              # Axios API instance & base URLs
│   │   ├── context/             # AuthContext state management
│   │   ├── pages/               # Application routes (Home, Analyze, Interview, Dashboard, Login, Register, Feedback)
│   │   ├── App.jsx              # Router configuration
│   │   ├── index.css            # Tailwind CSS v4 & custom obsidian tokens
│   │   └── main.jsx             # React DOM entrypoint
│   ├── index.html               # Main HTML container
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Vite build configuration
│
├── server/                      # Node.js + Express Backend API
│   ├── src/
│   │   ├── config/              # MongoDB connection & Email transporter
│   │   ├── controllers/         # Request handling logic (Auth, Resume, Interview, AI)
│   │   ├── middleware/          # JWT Auth verification & Multer file handler
│   │   ├── models/              # Mongoose database schemas (User, Resume, InterviewSession)
│   │   ├── router/              # REST Express routes
│   │   └── utils/               # AI prompts, JD matching algorithms & NodeMailer service
│   ├── .env                     # Environment variables configuration
│   ├── index.js                 # Express server startup entrypoint
│   └── package.json             # Backend dependencies
│
├── api-documentation.md         # Comprehensive REST API specifications
├── architecture-diagram.png     # Visual system architecture diagram
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MongoDB**: Active MongoDB Atlas URI or local instance
* **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

---

### 📥 1. Installation

Clone the repository to your local machine:
```bash
git clone https://github.com/Satakshivdhy/HackInMotion-RICR-HIM-1082.git
cd HackInMotion-RICR-HIM-1082
```

---

### ⚙️ 2. Server Configuration & Setup

Navigate to the `server` directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:
```env
PORT=4500
MONGO_DB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_google_gemini_api_key

# NodeMailer configuration (Optional for OTP email reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

Start the backend development server:
```bash
npm run dev
```
The server will start running at `http://localhost:4500`.

---

### 💻 3. Client Configuration & Setup

Open a new terminal window, navigate to the `client` directory, and install dependencies:
```bash
cd ../client
npm install
```

Start the Vite frontend server:
```bash
npm run dev
```
The frontend application will open at `http://localhost:5173`.

---

## 🔌 Core API Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a new user account |
| `POST` | `/api/auth/login` | Public | Authenticates user & returns JWT token |
| `GET`  | `/api/auth/me` | Protected | Returns authenticated user profile |
| `POST` | `/api/resume/upload` | Protected | Parses resume file & calculates JD match score |
| `POST` | `/api/ai/rewrite-bullet` | Protected | Re-engineers resume bullet points via Gemini AI |
| `POST` | `/api/interview/start` | Protected | Initializes an AI mock interview session |
| `POST` | `/api/interview/submit-answer` | Protected | Evaluates candidate answer & returns feedback |
| `POST` | `/api/feedback` | Public | Submits user platform feedback |


---

## 🎨 Design System

PrepOrbit utilizes an Obsidian Dark Mode aesthetic (`#030014`) with glassmorphic cards (`backdrop-filter: blur(18px)`), vibrant electric purple accents (`#a855f7`), cyan highlights (`#06b6d4`), and modern typography powered by **Outfit** and **Plus Jakarta Sans** Google Fonts.

---

## 📜 License & Credits

Developed with ❤️ by **Team HackInMotion-1082**.
Distributed under the **ISC License**.

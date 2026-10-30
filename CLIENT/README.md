# ⚛️ CareerNova_AI — Frontend Client Application

**Framework**: React 19.2 + Vite 8.2  
**Styling**: Tailwind CSS v4 + FlyonUI (Deep Obsidian Glassmorphism Design System)  
**Routing**: React Router DOM v7  
**Icons**: React Icons (Heroicons, Feather Icons)

---

## 1. Architecture Overview

The `CLIENT` subproject provides an intuitive, high-performance single-page application (SPA) for resume scanning, AI bullet rewriting, analytics dashboards, and interactive mock interviews with proctoring.

```
CLIENT/
├── public/                  # Static assets & public files
├── src/
│   ├── assets/              # Branding images and media
│   ├── components/
│   │   ├── commonModals/    # ForgotPasswordModal, PasswordChangeModal
│   │   ├── ErrorBoundary.jsx# React 19 Class Error Boundary with retry UI
│   │   ├── Footer.jsx       # Global footer component
│   │   ├── Navbar.jsx       # Navigation bar with auth status and theme toggle
│   │   ├── ProtectedRoute.jsx# Auth route guard redirecting unauthenticated users
│   │   └── ThemeSwitcher.jsx# Dark/light theme selector
│   ├── config/
│   │   └── ApiConfig.jsx    # Axios instance with Bearer interceptors & 401 handler
│   ├── context/
│   │   ├── AuthContext.jsx  # Lazy-initialized authentication state provider
│   │   └── ThemeContext.jsx # Theme state provider
│   ├── pages/
│   │   ├── Analyze.jsx      # Resume upload, parsing, and JD keyword alignment
│   │   ├── Dashboard.jsx    # Candidate performance graphs and history
│   │   ├── Feedback.jsx     # User feedback submission form
│   │   ├── Home.jsx         # Landing page and feature showcase
│   │   ├── Interview.jsx    # AI mock interview room with vision/voice proctoring
│   │   ├── Login.jsx        # Candidate login with validation
│   │   ├── NotFound.jsx     # Custom 404 Not Found error page
│   │   └── Register.jsx     # Registration & OTP email verification form
│   ├── App.jsx              # Central router configuration
│   ├── index.css            # Tailwind CSS v4 directives & custom obsidian tokens
│   └── main.jsx             # React DOM root entry point
├── tests/
│   ├── auth.test.js         # Client storage persistence and logout tests
│   └── validation.test.js   # Email, password, and file validation tests
├── index.html               # SPA container
├── package.json             # Frontend dependencies & npm scripts
└── vite.config.js           # Vite 8 build configuration
```

---

## 2. Key Engineering Standards

### 2.1 API Configuration & Interceptors ([`src/config/ApiConfig.jsx`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/CLIENT/src/config/ApiConfig.jsx))
- Resolves backend URL via `import.meta.env.VITE_API_URL` or `import.meta.env.VITE_BACKEND_URL`, defaulting to `http://localhost:4500`.
- Outgoing Request Interceptor: Automatically attaches `Authorization: Bearer <token>` from `localStorage.getItem("token")`.
- Incoming Response Interceptor: Catches HTTP 401 Unauthorized errors, purges stale credentials from `localStorage`, and triggers re-authentication.

### 2.2 Resilient State Initialization ([`src/context/AuthContext.jsx`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/CLIENT/src/context/AuthContext.jsx))
- Uses lazy functional state initializers `useState(() => getStoredUser())` and `useState(() => getStoredToken())`.
- Eliminates cascading render cycles and flashes of unauthenticated content.

### 2.3 Component Purity & Lifecycle Safety ([`src/pages/Interview.jsx`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/CLIENT/src/pages/Interview.jsx))
- Timer calculations are hoisted outside the render lifecycle to comply with React 19 compiler strictness (`react-hooks/purity`).
- Camera references (`videoRef.current`) are set and cleaned up exclusively within `useEffect` boundaries.
- Speech recognition hooks are wrapped in memoized callbacks (`useCallback`) to avoid stale closure bugs.

### 2.4 Error Boundary & Fallback Handling ([`src/components/ErrorBoundary.jsx`](file:///c:/Users/payal/OneDrive/Desktop/@Payal/CareerNovaAI/CLIENT/src/components/ErrorBoundary.jsx))
- Catches uncaught runtime render exceptions across child components.
- Renders an obsidian glassmorphism fallback card with an automatic page reload action, preventing white-screen crashes.

---

## 3. Scripts & Verification

```bash
# Start Vite development server with HMR on port 5173
npm run dev

# Run ESLint (enforces React 19 strict rules; 0 errors, 0 warnings)
npm run lint

# Run frontend validation and storage integrity unit tests
npm test

# Build production bundle for deployment (JS bundle 277 kB gzipped)
npm run build

# Preview production build locally
npm run preview
```

---

## 4. Environment Variables

Create `.env` in `CLIENT/` (see `.env.example`):
```env
VITE_API_URL=http://localhost:4500
```
In production, set `VITE_API_URL` to your production API domain (e.g., `https://api.careernova.ai`).

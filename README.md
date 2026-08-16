# 🛡️ AI Security Scanner

A production-ready, premium full-stack security vulnerability scanner where developers paste single code snippets, drag-and-drop multiple files, or upload `.zip` source archives to receive instant AI-powered security audits. The scanner identifies vulnerabilities, estimates risk scores, categorizes issues by severity and CWE, explains the underlying exploit vectors, provides side-by-side before/after code diffs, and generates downloadable audit reports.

---

## 📸 Overview & Demo Workflow

```
 ┌───────────────────────────┐         ┌──────────────────────────┐
 │  Single File / ZIP Upload │ ──────> │  FastAPI Backend Engine  │
 └───────────────────────────┘         └──────────────────────────┘
               │                                    │
               ▼                                    ▼
 ┌───────────────────────────┐         ┌──────────────────────────┐
 │ Multi-Select Severity     │ <────── │ Gemini AI + Static Rules │
 │ & Side-by-Side Code Diff  │         │ SHA-256 TTL Cache & Logs │
 └───────────────────────────┘         └──────────────────────────┘
```

---

## 🚀 Key Features

* **Multi-File & ZIP Archive Auditing**: Drag-and-drop multiple source files at once or upload a `.zip` archive to extract and audit entire codebases in batch. Includes a 1 MB per-file safety guardrail and 10 MB total batch cap.
* **Side-by-Side Before/After Code Diff**: Visualizes recommended security fixes alongside original vulnerable snippets with an interactive Side-by-Side vs. Unified diff viewer powered by `react-diff-viewer-continued`.
* **Multi-Select Severity Filtering**: Interactive severity count badges (Critical, High, Medium, Low) that allow multi-select filtering to isolate specific risk categories.
* **Report Export (Markdown & PDF)**: Copy a formatted Markdown summary directly to the clipboard, or export full audit reports client-side as `.md` or `.pdf` files via `jsPDF`.
* **Linear & Raycast Tier UI Polish**: Designed with a slate dark palette (`#0B0F17`), `JetBrains Mono` code typography, Apple fluid motion states, glass header panels, and an enlarged emotional risk gauge with spring physics.
* **AI-Powered & Static Rule Engine**: Automatically leverages Google Gemini API for deep security auditing. If the API key is unconfigured or rate limited, the system gracefully falls back to a local heuristic static analysis engine.
* **Backend Hardening**:
  * **IP Rate Limiting**: Enforces request limits via `slowapi` (default 10 req/min per IP, configurable via `RATE_LIMIT_PER_MINUTE`).
  * **In-Memory SHA-256 TTL Cache**: Hashes code payloads to serve duplicate scan requests instantly from cache (`cachetools.TTLCache`) and avoid redundant AI tokens.
  * **Structured JSON Logging**: Logs request duration, engine source (`ai_gemini` vs `static_fallback`), finding counts, and cache hits without exposing source code or secrets.
  * **Pytest Unit Test Suite**: Includes 100% passing test coverage (`backend/test_scanner.py`) for static fallback detection across SQL injection, hardcoded secrets, command injection, and weak hashing.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, `react-diff-viewer-continued`, `jsPDF`, `JSZip`, Lucide Icons
* **Backend**: Python FastAPI, Uvicorn, Pydantic v2, `slowapi`, `cachetools`, `pytest`, `python-dotenv`
* **AI Engine**: Google Gemini API via `google-generativeai` SDK

---

## 📂 Project Structure

```text
security-scanner/
├── backend/
│   ├── main.py            # FastAPI endpoints, CORS, slowapi rate limiting & JSON logging
│   ├── scanner.py         # Gemini API engine, static fallback scanner & SHA-256 TTL cache
│   ├── models.py          # Pydantic v2 schemas for single & batch scan requests/responses
│   ├── test_scanner.py    # Pytest unit test suite for static rule engine
│   ├── requirements.txt   # Python dependencies
│   └── .env               # Environment configuration file
└── frontend/
    ├── src/
    │   ├── App.tsx        # Main application layout, batch state & status polling
    │   ├── index.css      # Core design tokens, typography tiers & Apple motion keyframes
    │   ├── api/
    │   │   └── scanner.ts # Typed API client for single & batch scan requests
    │   └── components/
    │       ├── CodeEditor.tsx   # Code editor panel with JSZip extraction & batch queue
    │       ├── ScanResults.tsx  # Scorecard dashboard, severity filters, per-file breakdown & export
    │       └── VulnCard.tsx     # Security card with side-by-side ReactDiffViewer
    ├── package.json       # Node package manager configuration
    ├── vite.config.ts     # Vite builder configuration
    └── tailwind.config.js # Tailwind CSS design system extensions
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
Ensure you have **Python 3.10+** and **Node.js 18+** installed.

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the unit test suite:
   ```bash
   pytest test_scanner.py
   ```
4. Configure your API key in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   RATE_LIMIT_PER_MINUTE=10
   CACHE_TTL_SECONDS=3600
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *Backend service runs at `http://localhost:8000`.*

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install the Node packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Frontend application runs at `http://localhost:5173`.*

---

## ☁️ Production Deployment

### 1. Backend Settings (Render / Railway)
* **Root Directory:** `security-scanner/backend`
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
* **Environment Variables:**
  * `GEMINI_API_KEY`: Your live Google Gemini API key.
  * `RATE_LIMIT_PER_MINUTE`: Request quota per IP (e.g. `20`).

### 2. Frontend Settings (Vercel / Netlify)
* **Framework Preset:** `Vite`
* **Root Directory:** `security-scanner/frontend`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Environment Variables:**
  * `VITE_API_URL`: Your live backend API URL (e.g., `https://codescanner-wb82.onrender.com`).

---

## 🧪 How to Test the Scanner

1. Launch both the backend and frontend servers (or open the live production URL).
2. Click **"Load Demo"** in the editor header to test an intentionally vulnerable script (SQL Injection, Hardcoded Secrets, Command Injection, Weak Cryptography).
3. Drag and drop a `.zip` file or multiple code files to test **Batch Audit Mode**.
4. Click **"Scan Code"** / **"Scan Batch"**.
5. Explore the interactive severity filters, click **"Before / After Code Diff"** to inspect side-by-side fixes, and click **"Export"** to download your report as Markdown or PDF.

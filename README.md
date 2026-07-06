# 🛡️ AI Security Scanner

A production-ready full-stack security vulnerability scanner where developers paste or upload source code and receive instant AI-powered security audits. The scanner identifies vulnerabilities, estimates risk scores, categorizes issues by severity and CWE, explains the underlying exploits, and provides secure code corrections.

---

## 🚀 Key Features

* **AI-Powered & Fallback Static Analysis**: Automatically leverages Google Gemini API for deep security auditing. If the API key is not configured, the system gracefully falls back to a rules-based static analyzer so it works out of the box!
* **Interactive Code Workspace**: Features an integrated code input panel with line numbering, language selector dropdown, clear controls, and demo code loading.
* **Drag-and-Drop File Import**: Drag and drop any source code file directly into the workspace to immediately import its content, complete with a 1 MB file size safety guardrail.
* **Automatic Language Mapping**: Auto-detects the programming language based on the imported file's extension (e.g., `.py` ➔ Python, `.java` ➔ Java, `.sql` ➔ SQL).
* **Manual File Selector Option**: Provides a clean upload toolbar button that launches the native OS file explorer dialog.
* **Synchronized Scroll Gutter**: Code editor textarea and line-number gutter scroll together seamlessly in vertical sync.
* **Custom Dropdown Selector**: Custom state-driven React select component for selecting languages, replacing native browser dropdown elements.
* **Unified Security Scorecard**: Visualizes security score (0–100) using an animated circular gauge colored dynamically by risk level.
* **Dynamic API Status Monitor**: Real-time status badge (`OPERATIONAL`, `CONNECTING...`, `OFFLINE`) displaying connection health to the backend service.
* **Skeleton Loading Experience**: Animated skeleton screens mapping to the audit reports layout while an active code scan runs.
* **Remediation & Code Fixes**: Displays detailed vulnerability cards mapping to CWE classes, featuring "Why it's risky" impact sections and collapsible/copyable secure code remediations.
* **Premium Dark Theme**: Custom dark slate/indigo theme (`#090d16` background, `#111625` cards, `#1f293d` borders) built with React, TypeScript, and Tailwind CSS.

---

## 🛠️ Tech Stack

* **Frontend**: React, TypeScript, Tailwind CSS, Vite, Lucide Icons
* **Backend**: Python FastAPI, Uvicorn, Pydantic, python-dotenv
* **AI Engine**: Google Gemini API via `google-generativeai` SDK

---

## 📂 Project Structure

```text
security-scanner/
├── backend/
│   ├── main.py            # FastAPI main server & CORS setup
│   ├── scanner.py         # Gemini API scanner & static rule engine
│   ├── models.py          # Pydantic schemas for request & response
│   ├── requirements.txt   # Python dependency declarations
│   └── .env               # Local configuration environment file
└── frontend/
    ├── src/
    │   ├── App.tsx        # Main application layout & status polling
    │   ├── index.css      # Core styles & custom animations
    │   ├── api/
    │   │   └── scanner.ts # API request handler
    │   └── components/
    │       ├── CodeEditor.tsx   # Code editor panel with drag-and-drop & custom select
    │       ├── ScanResults.tsx  # Scorecard dashboard, empty state & skeleton loader
    │       └── VulnCard.tsx     # Expandable security card component
    ├── package.json       # Node package manager configuration
    ├── vite.config.ts     # Vite builder setup
    └── tailwind.config.js # Tailwind CSS theme variables
```

---

## ⚙️ Installation & Local Setup

### Prerequisite
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
3. Configure your API key:
   - Open the `.env` file.
   - Replace `your_key_here` with your free Google Gemini API key obtained from [Google AI Studio](https://aistudio.google.com/apikey):
     ```env
     GEMINI_API_KEY=AIzaSy...
     ```
4. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend will be running at `http://localhost:8000`.*

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
   *The frontend application will be running at `http://localhost:5173`.*

---

## ☁️ Production Deployment

When deploying to hosting environments like **Vercel** (frontend) and **Render** (backend), use the following configuration settings:

### 1. Backend Settings (Render)
* **Root Directory:** `security-scanner/backend`
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
* **Environment Variables:**
  * `GEMINI_API_KEY`: Your live Google Gemini API key.

### 2. Frontend Settings (Vercel)
* **Framework Preset:** `Vite` (Auto-detected)
* **Root Directory:** `security-scanner/frontend`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Environment Variables:**
  * `VITE_API_URL`: Your live Render backend URL (e.g., `https://codescanner-wb82.onrender.com` — *no trailing slash*).

---

## 🧪 How to Test the Scanner

1. Launch both the backend and frontend servers (or open the live production URL).
2. Click the **"Load Demo"** button on the editor top bar to pre-populate an intentionally vulnerable Python script containing SQL Injection, Hardcoded Secrets, Command Injection, and Weak Cryptography.
3. Click **"Scan Code"**.
4. View the security scorecard results, expandable vulnerability findings, and copy secure code remediations directly from the browser!

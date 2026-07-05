# 🛡️ AI Security Scanner

A production-ready full-stack security vulnerability scanner where developers paste source code and receive instant AI-powered security audits. The scanner identifies vulnerabilities, estimates risk scores, categorizes issues by severity and CWE, explains the underlying exploits, and provides secure code corrections.

---

## 🚀 Key Features

* **AI-Powered & Fallback Static Analysis**: Automatically leverages Google Gemini API for deep security auditing. If the API key is not configured, the system gracefully falls back to a rules-based static analyzer so it works out of the box!
* **Interactive Code Workspace**: Features an integrated code input panel with line numbering, language selector dropdown, clear controls, and demo code loading.
* **Unified Security Scorecard**: Visualizes security score (0–100) using an animated circular gauge colored dynamically by risk level.
* **Remediation & Code Fixes**: Displays detailed vulnerability cards mapping to CWE classes, featuring "Why it's risky" impact sections and collapsible/copyable secure code remediations.
* **Sleek Dark Terminal Theme**: Custom dark theme (`#0d1117`) built with React, TypeScript, and Tailwind CSS.

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
    │   ├── App.tsx        # Main application component
    │   ├── index.css      # Core styles & Tailwind imports
    │   ├── api/
    │   │   └── scanner.ts # API request handler
    │   └── components/
    │       ├── CodeEditor.tsx   # Left-hand code editor component
    │       ├── ScanResults.tsx  # Right-hand score & summary dashboard
    │       └── VulnCard.tsx     # Expandable security card component
    ├── package.json       # Node package manager configuration
    ├── vite.config.ts     # Vite builder setup
    └── tailwind.config.js # Tailwind CSS theme variables
```

---

## ⚙️ Installation & Setup

### Prerequisite
Ensure you have **Python 3.10+** and **Node.js 18+** installed.

---

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

---

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

## 🧪 How to Test the Scanner

1. Launch both the backend (`port 8000`) and frontend (`port 5173`) servers.
2. Open your browser to `http://localhost:5173`.
3. Click the **"Load Demo"** button on the editor top bar to pre-populate an intentionally vulnerable Python script containing SQL Injection, Hardcoded Secrets, Command Injection, and Weak Cryptography.
4. Click **"Scan Code"**.
5. View the security scorecard results, expandable vulnerability findings, and copy secure code remediations directly from the browser!

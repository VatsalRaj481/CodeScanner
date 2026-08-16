# 🛡️ AI Security Scanner

A production-ready, high-performance security vulnerability auditing platform. Developers can paste single code snippets, drag-and-drop multiple source files, or upload `.zip` archives to receive instant AI-powered security audits.

The scanner analyzes code for vulnerabilities, calculates risk scores (0–100), categorizes issues by CWE and severity level, explains potential exploit vectors, renders interactive **Side-by-Side Before/After Code Diffs**, tracks historical risk trends, and generates client-side Markdown (.md) & PDF (.pdf) audit reports.

---

## 📸 Architecture & Workflow Overview

```
 ┌───────────────────────────┐         ┌──────────────────────────────┐
 │  Single File / Multi-File │ ──────> │  FastAPI Backend API Service │
 │   or ZIP Archive Upload   │         │  (Rate-Limited & JSON-Logged)│
 └───────────────────────────┘         └──────────────────────────────┘
               │                                       │
               ▼                                       ▼
 ┌───────────────────────────┐         ┌──────────────────────────────┐
 │ Interactive Code Workspace│ <────── │ Dual Engine: Gemini AI +     │
 │ & Recharts Risk Trend     │         │ Static Fallback Analyzer     │
 └───────────────────────────┘         │ (SHA-256 In-Memory TTL Cache)│
                                       └──────────────────────────────┘
```

---

## ✨ What It Can Do (Capabilities & Features)

### 1. Source Code Input & Multi-File Batch Auditing
- **Single Snippet & File Drop**: Paste code or drag-and-drop files directly into the editor with automatic line numbering and synchronized scroll gutter.
- **Automatic Language Detection**: Maps file extensions (`.py`, `.js`, `.ts`, `.java`, `.go`, `.php`, `.sql`, `.sh`) to syntax definitions automatically.
- **ZIP Archive & Folder Extraction**: Client-side decompression of `.zip` repositories (`JSZip`), extracting and queuing all supported code files for batch scanning.

### 2. Deep Vulnerability Analysis & Dual-Engine Intelligence
- **Primary AI Engine**: Queries Google Gemini API for contextual security analysis, vulnerability scoring, and remediation recommendations.
- **Static Heuristic Fallback Engine**: If no API key is provided or Gemini is unreachable, the system automatically falls back to an offline rule-based scanner (detecting SQL Injection `CWE-89`, Hardcoded Secrets `CWE-798`, Command Injection `CWE-78`, and Weak Cryptography `CWE-327`).
- **Engine Source & Confidence Tagging**: Annotates every finding with its detection source (`ai_gemini` vs `static_fallback`) and confidence rating (`high` | `medium` | `low`).

### 3. Interactive Audit Reports & Remediation Diffs
- **Risk Score & Gauge**: Computes an overall security score (0–100) and risk level (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `SECURE`) visualized via a spring-physics animated gauge.
- **Per-File Accordion Breakdown**: For batch scans, displays an expandable per-file breakdown with individual file risk scores and clean bill of health indicators.
- **Side-by-Side Before/After Code Diff**: Visualizes recommended security fixes alongside original code snippets using an interactive **Side-by-Side vs. Unified** diff viewer (`react-diff-viewer-continued`).
- **Multi-Select Severity Filter**: Toggle Critical, High, Medium, or Low severity count badges to filter findings instantly.
- **Copy Report & Export**: Copy formatted Markdown summaries or download complete reports client-side as `.md` or `.pdf` files (`jsPDF`).

### 4. Local Audit History & Trend Analytics
- **LocalStorage Persistence**: Automatically saves recent scan metadata without sending code to external databases.
- **Recharts Security Trend Chart**: Renders a responsive risk score trend graph across historical scans.
- **Read-Only Audit Reloading**: Click any past scan in history to inspect its complete report without re-executing a scan.
- **Apple-Style Destructive Confirmation**: Clear history action requires explicit user confirmation.

---

## ⚠️ System Guardrails & Resource Limits

To ensure optimal performance, low latency, and safety, the following limits are enforced across the platform:

| Guardrail / Limit | Threshold Value | Enforcement Scope & Description |
| :--- | :--- | :--- |
| **Single File Size Limit** | `1 MB` max per file | Client-side guardrail preventing browser memory exhaustion during file import. |
| **Batch / ZIP Archive Limit** | `10 MB` max total | Maximum aggregate payload size for multi-file selections or compressed `.zip` archives. |
| **Backend IP Rate Limit** | `10 requests / minute` | Enforced per IP via `slowapi` on `/api/scan` and `/api/scan-batch` (configurable via `RATE_LIMIT_PER_MINUTE`). |
| **In-Memory Cache TTL** | `1 Hour` (3600s) | SHA-256 code payload hashing stores identical scan responses in `cachetools.TTLCache` to prevent redundant AI API quota usage. |
| **LocalStorage History Cap** | `20 most recent scans` | Automatically caps stored audit history to the 20 latest entries to preserve browser storage. |
| **Sensitive Code Privacy** | `Truncated Preview (~100 chars)` | Local storage persists metadata, score, and a 100-character preview string ONLY — never full source code. |

---

## 🛠️ Tech Stack

* **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, `recharts`, `react-diff-viewer-continued`, `jsPDF`, `JSZip`, Lucide Icons
* **Backend**: Python FastAPI, Uvicorn, Pydantic v2, `slowapi`, `cachetools`, `pytest`, `python-dotenv`
* **AI Engine**: Google Gemini API via `google-generativeai` SDK

---

## 📂 Project Structure

```text
security-scanner/
├── backend/
│   ├── main.py            # FastAPI endpoints, CORS, slowapi rate limiting & structured JSON logging
│   ├── scanner.py         # Gemini AI engine, static fallback scanner & SHA-256 TTL cache
│   ├── models.py          # Pydantic v2 schemas for single & batch scan requests/responses
│   ├── test_scanner.py    # Pytest unit test suite for static rule engine
│   ├── requirements.txt   # Python dependency declarations
│   └── .env               # Local configuration environment file
└── frontend/
    ├── src/
    │   ├── App.tsx        # Main application layout, scan state & history persistence
    │   ├── index.css      # Core design tokens, typography tiers & Apple motion keyframes
    │   ├── api/
    │   │   └── scanner.ts # Typed API client for single & batch scan requests
    │   └── components/
    │       ├── CodeEditor.tsx        # Code editor panel with JSZip extraction & batch queue
    │       ├── ScanResults.tsx       # Scorecard dashboard, severity filters, per-file breakdown & export
    │       ├── VulnCard.tsx          # Security card with side-by-side ReactDiffViewer
    │       └── ScanHistoryPanel.tsx  # Audit history panel with Recharts trend chart
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
   python -m uvicorn main:app --reload --port 8000
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
  * `RATE_LIMIT_PER_MINUTE`: Request quota per IP (e.g., `20`).

### 2. Frontend Settings (Vercel / Netlify)
* **Framework Preset:** `Vite`
* **Root Directory:** `security-scanner/frontend`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Environment Variables:**
  * `VITE_API_URL`: Your live backend API URL (e.g., `https://codescanner-wb82.onrender.com`).

---

## 🧪 How to Test the Scanner

1. Launch both backend and frontend servers (or open the live production URL).
2. Click **"Load Demo"** in the editor header bar to load a sample script containing SQL Injection, Hardcoded Secrets, Command Injection, and Weak Cryptography.
3. Upload multiple files or a `.zip` archive to test **Batch Audit Mode**.
4. Click **"Scan Code"** / **"Scan Batch"**.
5. Inspect the security scorecard, click **"Before / After Code Diff"** to compare fixes side-by-side, filter by severity badges, view historical trends under **"History"**, and export reports as Markdown or PDF.

# 🛡️ AI Security Scanner

A production-ready, high-performance static and AI-powered security vulnerability auditing platform. Developers can paste single code snippets across **8 programming languages**, drag-and-drop multiple source files, or upload `.zip` archives to receive instant security audits.

The scanner analyzes code for vulnerabilities, calculates risk scores (0–100), categorizes issues by CWE and severity level, explains potential exploit vectors, renders interactive **Side-by-Side Before/After Code Diffs**, tracks historical risk trends, and generates client-side Markdown (.md) & PDF (.pdf) audit reports.

---

## 📸 Architecture & System Workflow

```text
  ┌────────────────────────────────────────────────────────┐
  │                 React / TypeScript UI                  │
  │  • Single Snippet / Drag-and-Drop / ZIP Decompression  │
  │  • Multi-Language Demo Engine & Smart Dropdown Swap    │
  │  • Smooth Non-Flickering Audit Shell & Score Gauge     │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼  HTTP POST /api/scan or /api/scan-batch
  ┌────────────────────────────────────────────────────────┐
  │                 FastAPI Backend Service                │
  │  • slowapi Rate Limiter (10 req/min per IP)            │
  │  • SHA-256 Code Payload In-Memory TTL Cache            │
  └───────────────────────────┬────────────────────────────┘
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     Primary AI Engine         │   │   Static Rule Fallback Engine │
│  Google Gemini API (JSON Schema)│   │ Multi-Language Regex Scanner │
│  Contextual Audit & Remediation│   │ (CWE-89, 78, 798, 327 Rules)  │
└───────────────────────────────┘   └───────────────────────────────┘
```

---

## 🧠 How the System Works & Scoring Logic

### 1. Request Lifecycle & Dual-Engine Routing
1. **Payload Normalization & Hashing**: The backend receives source code and language context. It computes a SHA-256 hash `sha256(language:code)` used as a lookup key for the `cachetools.TTLCache`. If an identical payload was scanned within the TTL window (default: 1 hour), the cached result is returned instantly.
2. **Dual-Engine Execution**:
   - **Primary Engine (Gemini AI)**: If `GEMINI_API_KEY` is configured, the backend prompts Gemini (`gemini-1.5-pro` / `gemini-1.5-flash`) enforcing strict JSON Schema output. Gemini performs deep static analysis, line-level vulnerability identification, CVSS impact assessment, and secure fix code generation.
   - **Fallback Engine (Rule-Based Analyzer)**: If no API key is present or the AI service is unreachable, the system automatically routes to a deterministic static regex analyzer. It evaluates security anti-patterns across all 8 languages for:
     - **SQL Injection (`CWE-89`)**
     - **Command Injection (`CWE-78`)**
     - **Hardcoded Sensitive Credentials (`CWE-798`)**
     - **Weak Cryptographic Hash Functions (`CWE-327`)**

---

### 2. Security Score & Risk Level Calculation

The overall Security Score is an integer from **0 to 100** (where `100` represents perfectly secure code and `0` indicates severe compromise).

#### A. Single Snippet Scoring Formula (Static Fallback Engine)
- **Base Score**: Starts at `100`.
- **Deduction Per Finding**: Each unique vulnerability category deducts **22 points**:
  $$\text{Score} = \max\left(10, 100 - (\text{Count of Unique Vulnerability Categories} \times 22)\right)$$
- **Example Calculation**:
  A demo snippet containing SQL Injection, Command Injection, Hardcoded Secrets, and MD5 Hashing has 4 unique vulnerability categories:
  $$\text{Score} = 100 - (4 \times 22) = 12 \quad (\text{CRITICAL Risk})$$

#### B. Gemini AI Scoring Logic
The AI model evaluates vulnerability severity, exploitability, and attack surface to assign a score from 0–100 based on standard CVSS impact metrics.

#### C. Batch Scan Score Aggregation
For multi-file or `.zip` archive scans, individual file scores are combined into an overall weighted average based on Lines of Code (LOC):
$$\text{Overall Score} = \operatorname{round}\left( \frac{\sum (\text{File Score}_i \times \text{LOC}_i)}{\sum \text{LOC}_i} \right)$$
The overall **Risk Level** adopts the highest (worst-case) severity level present across all files in the batch:
$$\text{Risk Level} = \max(\text{File Risk Levels}) \quad \text{where } \text{CRITICAL} > \text{HIGH} > \text{MEDIUM} > \text{LOW} > \text{SECURE}$$

#### D. Risk Level Threshold Mapping
| Score Range | Risk Level Category | UI Theme | Description |
| :--- | :--- | :--- | :--- |
| **85 – 100** | `SECURE` / `EXCELLENT` | Emerald Green | High security posture, no critical vulnerabilities identified. |
| **60 – 84** | `MEDIUM` | Amber / Yellow | Minor flaws or cryptographic warnings identified. |
| **35 – 59** | `HIGH` | Orange | High severity flaw present (e.g. credentials, dangerous eval). |
| **0 – 34** | `CRITICAL` | Rose Red | Critical exploit vector present (e.g. SQL/Command Injection). |

---

## ✨ Features & Capabilities

### 1. Multi-Language Support & Smart Demo Engine
- **8 Supported Languages**: Full syntax and vulnerability scanning support for **Python**, **JavaScript**, **TypeScript**, **PHP**, **Java**, **Go**, **SQL**, and **Bash**.
- **Idiomatic Vulnerability Demo Snippets**: Pre-loaded demo code templates for all 8 languages, each containing 4 real-world CWE-mappable vulnerability patterns (evaluating to a consistent score of 12 for easy testing).
- **Smart Non-Destructive Demo Swap**: Consolidated **Load Demo** button in the source panel toolbar allows instant 1-click loading across all 8 languages. Changing the language dropdown automatically updates the editor content to that language's demo snippet **only if** the editor currently contains an unmodified demo. If you type or edit custom code, changing the dropdown updates the language detection context while keeping your custom code untouched.

### 2. Smooth & Persistent UI (Zero-Flicker Architecture)
- **Persistent Panel Shell**: The Audit Report panel shell, header bar, and export toolbar remain mounted during scanning, eliminating unmount/remount flickering.
- **Continuous Score Gauge Animation**: A smooth spring/lerp loop animates the score ring smoothly between values (e.g. 65 → 85) without dropping to 0.
- **Live Re-Scanning Banner**: Displays an animated live scanning indicator banner over existing results during re-scans.

### 3. Interactive Findings & Remediation Diffs
- **Side-by-Side Before/After Code Diff**: Visualizes recommended security fixes alongside original code snippets using an interactive **Side-by-Side vs. Unified** diff viewer (`react-diff-viewer-continued`).
- **Interactive Multi-Select Severity Badges**: Filter findings instantly by clicking Critical, High, Medium, or Low count badges.
- **Client-Side PDF & Markdown Export**: Download audit reports as formatted `.md` or `.pdf` files generated client-side (`jsPDF`).

### 4. Multi-File ZIP Extraction & Audit History
- **Client-Side ZIP Extraction**: Drag-and-drop `.zip` archives or multiple files to extract code files (`JSZip`) and execute batch auditing.
- **Per-File Accordion Breakdown**: Displays individual file scores, risk levels, and vulnerability breakdowns for batch scans.
- **LocalStorage Audit History & Analytics**: Persists scan history locally with a Recharts risk trend chart.

---

## ⚠️ System Guardrails & Resource Limits

| Guardrail / Limit | Threshold Value | Enforcement Scope & Description |
| :--- | :--- | :--- |
| **Single File Size Limit** | `1 MB` max per file | Client-side guardrail preventing browser memory exhaustion. |
| **Batch / ZIP Archive Limit** | `10 MB` max total | Maximum aggregate payload size for multi-file selections or compressed `.zip` archives. |
| **Backend IP Rate Limit** | `10 requests / minute` | Enforced per IP via `slowapi` on `/api/scan` and `/api/scan-batch`. |
| **In-Memory Cache TTL** | `1 Hour` (3600s) | SHA-256 code payload hashing stores scan responses in `cachetools.TTLCache`. |
| **LocalStorage History Cap** | `20 most recent scans` | Automatically caps stored audit history entries. |
| **Sensitive Code Privacy** | `Truncated Preview (~100 chars)` | Local storage persists metadata, score, and a 100-character preview string ONLY. |

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
│   ├── scanner.py         # Gemini AI engine, multi-language static fallback scanner & SHA-256 TTL cache
│   ├── models.py          # Pydantic v2 schemas for single & batch scan requests/responses
│   ├── test_scanner.py    # Pytest unit test suite for static rule engine
│   ├── requirements.txt   # Python dependency declarations
│   └── .env               # Local configuration environment file
└── frontend/
    ├── src/
    │   ├── App.tsx        # Main application layout, scan state & history persistence
    │   ├── index.css      # Core design tokens, typography tiers & Apple motion keyframes
    │   ├── demoSnippets.ts# Multi-language demo code templates & smart snippet detection
    │   ├── api/
    │   │   └── scanner.ts # Typed API client for single & batch scan requests
    │   └── components/
    │       ├── CodeEditor.tsx        # Code editor panel with JSZip extraction & multi-language dropdown
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
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the unit test suite:
   ```bash
   pytest test_scanner.py
   ```
4. Start the FastAPI server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
   *Backend service runs at `http://localhost:8000`.*

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Frontend application runs at `http://localhost:5173`.*

---

## 🧪 How to Test the Scanner

1. Launch both backend and frontend servers.
2. Select any language from the dropdown (**Python**, **JavaScript**, **TypeScript**, **PHP**, **Java**, **Go**, **SQL**, or **Bash**) or click **"Load Demo"** to see instant smart demo swapping.
3. Click **"Scan Code"** to trigger a security audit.
4. Upload multiple files or a `.zip` archive to test **Batch Audit Mode**.
5. Inspect the score ring gauge, click **"Before / After Code Diff"** to view side-by-side remediation fixes, filter findings by severity badges, check history analytics, and export reports as Markdown or PDF.

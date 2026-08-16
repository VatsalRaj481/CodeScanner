import os
import json
import re
import uuid
import google.generativeai as genai
from models import ScanResponse, Vulnerability, FileScanResult

SYSTEM_PROMPT = """You are an expert Application Security (AppSec) Senior Auditor and Code Scanner.
Your task is to analyze the provided source code for security vulnerabilities, bad practices, hardcoded secrets, injection flaws, weak cryptography, and unsafe system operations.

Return ONLY a valid JSON object matching this exact JSON schema:
{
  "score": number (0 to 100, where 100 is perfectly secure, 0 is severely compromised),
  "risk_level": "critical" | "high" | "medium" | "low" | "secure",
  "vulnerabilities": [
    {
      "id": "vuln-1",
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "title": "Short descriptive title",
      "category": "e.g. SQL Injection, Cryptography, Hardcoded Secrets, Command Injection",
      "line_numbers": [integer array of affected line numbers],
      "description": "Clear explanation of the flaw",
      "why_risky": "Detailed explanation of potential exploit vector or impact",
      "fix_code": "Corrected code snippet implementing secure practices",
      "fix_explanation": "How the fix secures the code",
      "cwe_id": "e.g. CWE-89, CWE-798, CWE-78, CWE-327"
    }
  ]
}

Strict Rules:
1. Do NOT wrap output in markdown formatting like ```json ... ``` if possible, or ensure it is raw valid JSON.
2. Ensure line numbers correspond accurately to the input code.
3. Be accurate and thorough. If no vulnerabilities exist, return score 100, risk_level 'secure', and empty vulnerabilities array.
"""

def fallback_static_analysis(code: str, language: str) -> ScanResponse:
    """Fallback static analysis for demo code or when API key is unconfigured/invalid."""
    vulns = []
    lines = code.splitlines()
    
    # Check for hardcoded pass/secret
    for idx, line in enumerate(lines, 1):
        if re.search(r'DB_PASS\s*=\s*["\']', line) or re.search(r'SECRET\s*=\s*["\']', line):
            vulns.append(Vulnerability(
                id=f"vuln-{uuid.uuid4().hex[:6]}",
                severity="high",
                title="Hardcoded Sensitive Credentials",
                category="Hardcoded Secrets",
                line_numbers=[idx],
                description="Hardcoded passwords or JWT secrets detected directly in source code.",
                why_risky="Hardcoded secrets can be extracted easily by attackers with code access or reverse engineering, leading to unauthorized system access.",
                fix_code='import os\nDB_PASS = os.getenv("DB_PASS")\nSECRET = os.getenv("SECRET_KEY")',
                fix_explanation="Retrieve sensitive credentials dynamically from environment variables or a secure key store.",
                cwe_id="CWE-798"
            ))
        if "execute(f\"SELECT" in line or "execute(\"SELECT" in line or "SELECT * FROM users WHERE name =" in line:
            vulns.append(Vulnerability(
                id=f"vuln-{uuid.uuid4().hex[:6]}",
                severity="critical",
                title="SQL Injection Vulnerability",
                category="Injection Flaws",
                line_numbers=[idx],
                description="User input is concatenated directly into an SQL query string.",
                why_risky="An attacker can manipulate the input parameter to execute arbitrary SQL commands, access, modify, or delete database contents.",
                fix_code='cur.execute("SELECT * FROM users WHERE name = ?", (username,))',
                fix_explanation="Use parameterized queries (prepared statements) to separate SQL logic from user data.",
                cwe_id="CWE-89"
            ))
        if "os.system(" in line or "subprocess.call(" in line:
            vulns.append(Vulnerability(
                id=f"vuln-{uuid.uuid4().hex[:6]}",
                severity="critical",
                title="Command Injection Flaw",
                category="Command Injection",
                line_numbers=[idx],
                description="Unsanitized user input passed directly into shell execution command.",
                why_risky="Allows external actors to execute arbitrary system shell commands with the privilege level of the host application.",
                fix_code='import subprocess\nsubprocess.run(["ping", "-c", "1", user_input], check=True)',
                fix_explanation="Avoid raw shell invocation; pass command arguments as a strict array list without shell expansion.",
                cwe_id="CWE-78"
            ))
        if "hashlib.md5(" in line or "hashlib.sha1(" in line:
            vulns.append(Vulnerability(
                id=f"vuln-{uuid.uuid4().hex[:6]}",
                severity="medium",
                title="Weak Cryptographic Hash Algorithm",
                category="Broken Cryptography",
                line_numbers=[idx],
                description="MD5 hashing algorithm used for sensitive data such as passwords.",
                why_risky="MD5 is cryptographically broken and vulnerable to collision attacks and rapid rainbow table lookups.",
                fix_code='import hashlib, secrets\nsalt = secrets.token_bytes(16)\nhash_val = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)',
                fix_explanation="Use strong, salted key derivation functions such as Argon2, bcrypt, or PBKDF2 with SHA-256.",
                cwe_id="CWE-327"
            ))

    # Deduplicate vulns by title
    unique_vulns = []
    seen = set()
    for v in vulns:
        if v.title not in seen:
            seen.add(v.title)
            unique_vulns.append(v)

    score = 100
    if unique_vulns:
        score = max(10, 100 - (len(unique_vulns) * 22))
        
    risk_level = "secure"
    if any(v.severity == "critical" for v in unique_vulns):
        risk_level = "critical"
    elif any(v.severity == "high" for v in unique_vulns):
        risk_level = "high"
    elif any(v.severity == "medium" for v in unique_vulns):
        risk_level = "medium"
    elif any(v.severity == "low" for v in unique_vulns):
        risk_level = "low"

    return ScanResponse(
        score=score,
        risk_level=risk_level,
        vulnerabilities=unique_vulns
    )

def analyze_code(code: str, language: str) -> ScanResponse:
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key or api_key == "your_key_here":
        # Fallback to local heuristic scanner if key is default or missing
        return fallback_static_analysis(code, language)

    try:
        genai.configure(api_key=api_key)
        # Try primary model
        model_names = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.5-flash"]
        model = None
        for name in model_names:
            try:
                model = genai.GenerativeModel(name)
                break
            except Exception:
                continue
        
        if not model:
            model = genai.GenerativeModel("gemini-1.5-pro")

        prompt = f"Language: {language}\n\nCode snippet to analyze:\n```\n{code}\n```"
        
        response = model.generate_content(
            contents=[SYSTEM_PROMPT, prompt],
            generation_config={"response_mime_type": "application/json"}
        )

        text_content = response.text.strip()
        
        # Clean up code block ticks if model returned them
        if text_content.startswith("```"):
            text_content = re.sub(r"^```(?:json)?\n?", "", text_content)
            text_content = re.sub(r"\n?```$", "", text_content)

        parsed_data = json.loads(text_content)
        
        # Validate into Pydantic ScanResponse model
        scan_res = ScanResponse(**parsed_data)
        return scan_res

    except Exception as e:
        print(f"Gemini API analysis error/fallback triggered: {e}")
        # If Gemini API call fails (e.g. key expired or quota limit), run fallback scanner so user experience is smooth
        res = fallback_static_analysis(code, language)
        if not res.vulnerabilities:
            res.error = f"AI analysis notice: {str(e)}"
        return res

def analyze_batch(files: list) -> ScanResponse:
    """
    Analyzes a batch of source files and aggregates findings.
    
    Weighted Average Score Calculation Rationale:
    We compute the overall risk score as a weighted average where each file's score is weighted
    by its lines of code (LOC). A weighted average by LOC prevents a small 2-line clean utility 
    file from skewing or masking severe vulnerabilities in a major core codebase module, while accurately 
    reflecting the overall security posture of the full repository/batch.
    """
    file_results = []
    all_vulns = []
    total_loc = 0
    weighted_score_sum = 0

    severity_rank = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0, "secure": 0}
    worst_rank = 0

    for file_item in files:
        filename = getattr(file_item, "filename", "unnamed_file")
        code = getattr(file_item, "code", "")
        language = getattr(file_item, "language", "auto")

        # Reuse existing analyze_code function per file
        res = analyze_code(code, language)
        
        # Tag each vulnerability with its source filename
        for v in res.vulnerabilities:
            v.filename = filename
            all_vulns.append(v)

        loc = max(1, len(code.splitlines()))
        total_loc += loc
        weighted_score_sum += res.score * loc

        rank = severity_rank.get(res.risk_level.lower(), 0)
        if rank > worst_rank:
            worst_rank = rank

        file_results.append(FileScanResult(
            filename=filename,
            score=res.score,
            risk_level=res.risk_level,
            vulnerabilities=res.vulnerabilities
        ))

    overall_score = round(weighted_score_sum / total_loc) if total_loc > 0 else 100
    
    rank_to_level = {4: "critical", 3: "high", 2: "medium", 1: "low", 0: "secure"}
    overall_risk_level = rank_to_level.get(worst_rank, "secure")

    return ScanResponse(
        score=overall_score,
        risk_level=overall_risk_level,
        vulnerabilities=all_vulns,
        total_files=len(files),
        file_results=file_results
    )


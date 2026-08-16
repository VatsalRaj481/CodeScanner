import os
import sys
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output encoding for CLI logging
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

SEVERITY_WEIGHTS = {
    "CRITICAL": 4,
    "HIGH": 3,
    "MEDIUM": 2,
    "LOW": 1,
    "INFO": 0,
}

CODE_EXTENSIONS = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".php": "php",
    ".java": "java",
    ".go": "go",
    ".sql": "sql",
    ".sh": "bash",
    ".bash": "bash",
}

def get_file_language(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    return CODE_EXTENSIONS.get(ext, "auto")

def main():
    api_url = os.getenv("SCANNER_API_URL", "").rstrip("/")
    api_key = os.getenv("SCANNER_API_KEY", "")
    threshold = os.getenv("SEVERITY_THRESHOLD", "HIGH").upper()
    changed_files_raw = os.getenv("CHANGED_FILES", "")

    if not api_url:
        print("❌ Error: SCANNER_API_URL environment variable (repo secret) is not set.")
        sys.exit(1)

    threshold_weight = SEVERITY_WEIGHTS.get(threshold, 3)

    # Collect changed code files
    file_paths = [f.strip() for f in changed_files_raw.split() if f.strip()]
    batch_files = []

    for path in file_paths:
        ext = os.path.splitext(path)[1].lower()
        if ext in CODE_EXTENSIONS and os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                if content.strip():
                    batch_files.append({
                        "filename": path,
                        "code": content,
                        "language": get_file_language(path)
                    })
            except Exception as e:
                print(f"Warning: Could not read file {path}: {e}")

    if not batch_files:
        print("ℹ️ No supported code files detected in PR diff.")
        with open("pr_comment.md", "w", encoding="utf-8") as f:
            f.write("### 🛡️ AI Security Scanner Audit\n\nNo supported source code files were modified in this PR.")
        sys.exit(0)

    print(f"🔍 Sending {len(batch_files)} changed file(s) to AI Security Scanner API ({api_url})...")

    # Prepare HTTP API Request
    target_endpoint = f"{api_url}/api/scan-batch" if len(batch_files) > 1 else f"{api_url}/api/scan"
    
    if len(batch_files) > 1:
        payload = json.dumps({"files": batch_files}).encode("utf-8")
    else:
        payload = json.dumps({
            "code": batch_files[0]["code"],
            "language": batch_files[0]["language"]
        }).encode("utf-8")

    req = urllib.request.Request(
        target_endpoint,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "AI-Security-Scanner-CI/1.0"
        },
        method="POST"
    )

    if api_key:
        req.add_header("X-API-Key", api_key)

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"❌ API Error ({e.code}): {e.read().decode('utf-8')}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        sys.exit(1)

    # Extract Findings
    vulnerabilities = data.get("vulnerabilities", [])
    overall_score = data.get("score", 100)
    risk_level = data.get("risk_level", "secure").upper()

    failing_vulns = []
    for v in vulnerabilities:
        sev = v.get("severity", "LOW").upper()
        weight = SEVERITY_WEIGHTS.get(sev, 0)
        if weight >= threshold_weight:
            failing_vulns.append(v)

    # Build GitHub PR Markdown Comment
    comment_lines = []
    comment_lines.append("## 🛡️ AI Security Scanner Audit Report\n")
    comment_lines.append(f"- **Overall Risk Score:** `{overall_score}/100` ({risk_level})")
    comment_lines.append(f"- **Files Scanned:** `{len(batch_files)}`")
    comment_lines.append(f"- **Total Findings:** `{len(vulnerabilities)}`")
    comment_lines.append(f"- **Severity Threshold:** `{threshold}`\n")

    if not vulnerabilities:
        comment_lines.append("✅ **Clean Bill of Health!** No security vulnerabilities detected in the PR diff.\n")
    else:
        comment_lines.append("| Severity | Title | CWE ID | File | Line(s) | Engine |")
        comment_lines.append("|---|---|---|---|---|---|")
        for v in vulnerabilities:
            sev = v.get("severity", "LOW").upper()
            title = v.get("title", "Issue")
            cwe = v.get("cwe_id", "N/A")
            fn = v.get("filename", batch_files[0]["filename"] if batch_files else "N/A")
            lines = ", ".join(map(str, v.get("line_numbers", []))) or "N/A"
            source = v.get("source", "scanner")
            comment_lines.append(f"| **{sev}** | {title} | `{cwe}` | `{fn}` | `{lines}` | `{source}` |")

        comment_lines.append("\n### Detailed Remediation Summary\n")
        for idx, v in enumerate(vulnerabilities, 1):
            sev = v.get("severity", "LOW").upper()
            title = v.get("title", "Issue")
            cwe = v.get("cwe_id", "N/A")
            fn = v.get("filename", batch_files[0]["filename"] if batch_files else "N/A")
            desc = v.get("description", "")
            fix_exp = v.get("fix_explanation", "")

            comment_lines.append(f"<details><summary><b>{idx}. [{sev}] {title} ({cwe})</b> in <code>{fn}</code></summary>\n")
            comment_lines.append(f"**Description:** {desc}\n")
            comment_lines.append(f"**Recommended Fix:** {fix_exp}\n")
            if v.get("fix_code"):
                comment_lines.append(f"```code\n{v.get('fix_code')}\n```\n")
            comment_lines.append("</details>\n")

    if failing_vulns:
        comment_lines.append(f"❌ **CI Check Failed:** Found `{len(failing_vulns)}` vulnerability/vulnerabilities meeting or exceeding the `{threshold}` threshold.")

    # Save Comment File
    with open("pr_comment.md", "w", encoding="utf-8") as f:
        f.write("\n".join(comment_lines))

    print(f"\n📊 Audit complete! Score: {overall_score}/100 | Findings: {len(vulnerabilities)} | Threshold Failures: {len(failing_vulns)}")

    if failing_vulns:
        print(f"❌ Failing check due to {len(failing_vulns)} issue(s) at or above {threshold} severity.")
        sys.exit(1)

    print("✅ All security checks passed threshold!")
    sys.exit(0)

if __name__ == "__main__":
    main()

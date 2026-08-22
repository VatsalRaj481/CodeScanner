package com.securityscanner.service;

import com.securityscanner.dto.ScanResponse;
import com.securityscanner.dto.Vulnerability;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class StaticAnalysisFallbackService {

    public ScanResponse analyzeCode(String code, String language) {
        List<Vulnerability> vulns = new ArrayList<>();
        if (code == null) {
            return new ScanResponse(100, "secure", new ArrayList<>());
        }

        String[] lines = code.split("\\r?\\n");

        for (int i = 0; i < lines.length; i++) {
            int idx = i + 1;
            String lineStr = lines[i].trim();
            String lineUpper = lineStr.toUpperCase();
            String lineLower = lineStr.toLowerCase();

            // 1. Hardcoded Credentials (CWE-798)
            if (lineUpper.contains("DB_PASS") || lineUpper.contains("SECRET") ||
                lineUpper.contains("ADMIN123") || lineUpper.contains("JWT_SECRET")) {
                vulns.add(new Vulnerability(
                        "vuln-" + UUID.randomUUID().toString().replace("-", "").substring(0, 6),
                        "high",
                        "Hardcoded Sensitive Credentials",
                        "Hardcoded Secrets",
                        Collections.singletonList(idx),
                        "Hardcoded passwords or JWT secrets detected directly in source code.",
                        "Hardcoded secrets can be extracted easily by attackers with code access or reverse engineering, leading to unauthorized system access.",
                        "import os\nDB_PASS = os.getenv(\"DB_PASS\")\nSECRET = os.getenv(\"SECRET_KEY\")",
                        "Retrieve sensitive credentials dynamically from environment variables or a secure key store.",
                        "CWE-798",
                        null,
                        "static_fallback",
                        "high"
                ));
            }

            // 2. SQL Injection (CWE-89)
            if (lineUpper.contains("SELECT") && (lineUpper.contains("WHERE") || lineUpper.contains("FROM"))) {
                vulns.add(new Vulnerability(
                        "vuln-" + UUID.randomUUID().toString().replace("-", "").substring(0, 6),
                        "critical",
                        "SQL Injection Vulnerability",
                        "Injection Flaws",
                        Collections.singletonList(idx),
                        "User input is concatenated directly into an SQL query string.",
                        "An attacker can manipulate the input parameter to execute arbitrary SQL commands, access, modify, or delete database contents.",
                        "cur.execute(\"SELECT * FROM users WHERE name = ?\", (username,))",
                        "Use parameterized queries (prepared statements) to separate SQL logic from user data.",
                        "CWE-89",
                        null,
                        "static_fallback",
                        "high"
                ));
            }

            // 3. Command Injection (CWE-78)
            if (lineStr.contains("os.system") || lineStr.contains("exec(") || lineStr.contains("exec `") ||
                lineStr.contains("system(") || lineStr.contains("exec.Command") || lineStr.contains("xp_cmdshell") ||
                lineStr.contains("eval(") || lineLower.contains("ping")) {
                vulns.add(new Vulnerability(
                        "vuln-" + UUID.randomUUID().toString().replace("-", "").substring(0, 6),
                        "critical",
                        "Command Injection Flaw",
                        "Command Injection",
                        Collections.singletonList(idx),
                        "Unsanitized user input passed directly into shell execution command.",
                        "Allows external actors to execute arbitrary system shell commands with the privilege level of the host application.",
                        "import subprocess\nsubprocess.run([\"ping\", \"-c\", \"1\", user_input], check=True)",
                        "Avoid raw shell invocation; pass command arguments as a strict array list without shell expansion.",
                        "CWE-78",
                        null,
                        "static_fallback",
                        "high"
                ));
            }

            // 4. Weak Cryptography (CWE-327)
            if (lineLower.contains("md5") || lineLower.contains("sha1") || lineLower.contains("md5sum")) {
                vulns.add(new Vulnerability(
                        "vuln-" + UUID.randomUUID().toString().replace("-", "").substring(0, 6),
                        "medium",
                        "Weak Cryptographic Hash Algorithm",
                        "Broken Cryptography",
                        Collections.singletonList(idx),
                        "MD5 or SHA1 hashing algorithm used for sensitive data such as passwords.",
                        "MD5 and SHA1 are cryptographically broken and vulnerable to collision attacks and rapid rainbow table lookups.",
                        "import hashlib, secrets\nsalt = secrets.token_bytes(16)\nhash_val = hashlib.pbkdf2_hmac(\"sha256\", password.encode(), salt, 100000)",
                        "Use strong, salted key derivation functions such as Argon2, bcrypt, or PBKDF2 with SHA-256.",
                        "CWE-327",
                        null,
                        "static_fallback",
                        "high"
                ));
            }
        }

        // Deduplicate vulns by title
        List<Vulnerability> uniqueVulns = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (Vulnerability v : vulns) {
            if (!seen.contains(v.getTitle())) {
                seen.add(v.getTitle());
                uniqueVulns.add(v);
            }
        }

        int score = 100;
        if (!uniqueVulns.isEmpty()) {
            score = Math.max(10, 100 - (uniqueVulns.size() * 22));
        }

        String riskLevel = "secure";
        boolean hasCritical = uniqueVulns.stream().anyMatch(v -> "critical".equalsIgnoreCase(v.getSeverity()));
        boolean hasHigh = uniqueVulns.stream().anyMatch(v -> "high".equalsIgnoreCase(v.getSeverity()));
        boolean hasMedium = uniqueVulns.stream().anyMatch(v -> "medium".equalsIgnoreCase(v.getSeverity()));
        boolean hasLow = uniqueVulns.stream().anyMatch(v -> "low".equalsIgnoreCase(v.getSeverity()));

        if (hasCritical) {
            riskLevel = "critical";
        } else if (hasHigh) {
            riskLevel = "high";
        } else if (hasMedium) {
            riskLevel = "medium";
        } else if (hasLow) {
            riskLevel = "low";
        }

        return new ScanResponse(score, riskLevel, uniqueVulns);
    }
}

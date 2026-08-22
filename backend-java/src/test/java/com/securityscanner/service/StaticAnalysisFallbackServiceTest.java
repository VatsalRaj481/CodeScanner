package com.securityscanner.service;

import com.securityscanner.dto.ScanResponse;
import com.securityscanner.dto.Vulnerability;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class StaticAnalysisFallbackServiceTest {

    private StaticAnalysisFallbackService fallbackService;

    @BeforeEach
    void setUp() {
        fallbackService = new StaticAnalysisFallbackService();
    }

    @Test
    void testSqlInjectionDetection() {
        String code = "cur.execute(f\"SELECT * FROM users WHERE name = '{username}'\")";
        ScanResponse result = fallbackService.analyzeCode(code, "python");

        assertEquals("critical", result.getRiskLevel());
        assertFalse(result.getVulnerabilities().isEmpty());

        Vulnerability sqlVuln = result.getVulnerabilities().stream()
                .filter(v -> "CWE-89".equals(v.getCweId()))
                .findFirst()
                .orElse(null);

        assertNotNull(sqlVuln);
        assertEquals("Injection Flaws", sqlVuln.getCategory());
        assertEquals("critical", sqlVuln.getSeverity());
        assertEquals("static_fallback", sqlVuln.getSource());
        assertEquals("high", sqlVuln.getConfidence());
    }

    @Test
    void testHardcodedSecretsDetection() {
        String code = "DB_PASS = \"super_secret_admin_123\"";
        ScanResponse result = fallbackService.analyzeCode(code, "python");

        assertFalse(result.getVulnerabilities().isEmpty());
        Vulnerability secretVuln = result.getVulnerabilities().stream()
                .filter(v -> "CWE-798".equals(v.getCweId()))
                .findFirst()
                .orElse(null);

        assertNotNull(secretVuln);
        assertEquals("Hardcoded Secrets", secretVuln.getCategory());
        assertEquals("high", secretVuln.getSeverity());
    }

    @Test
    void testCommandInjectionDetection() {
        String code = "import os\nos.system(\"ping \" + user_input)";
        ScanResponse result = fallbackService.analyzeCode(code, "python");

        assertFalse(result.getVulnerabilities().isEmpty());
        Vulnerability cmdVuln = result.getVulnerabilities().stream()
                .filter(v -> "CWE-78".equals(v.getCweId()))
                .findFirst()
                .orElse(null);

        assertNotNull(cmdVuln);
        assertEquals("Command Injection", cmdVuln.getCategory());
        assertEquals("critical", cmdVuln.getSeverity());
    }

    @Test
    void testWeakHashingDetection() {
        String code = "import hashlib\nhash_val = hashlib.md5(password.encode()).hexdigest()";
        ScanResponse result = fallbackService.analyzeCode(code, "python");

        assertFalse(result.getVulnerabilities().isEmpty());
        Vulnerability hashVuln = result.getVulnerabilities().stream()
                .filter(v -> "CWE-327".equals(v.getCweId()))
                .findFirst()
                .orElse(null);

        assertNotNull(hashVuln);
        assertEquals("Broken Cryptography", hashVuln.getCategory());
        assertEquals("medium", hashVuln.getSeverity());
    }

    @Test
    void testCleanCodeSecurity() {
        String code = "def add(a, b):\n    return a + b";
        ScanResponse result = fallbackService.analyzeCode(code, "python");

        assertEquals(100, result.getScore());
        assertEquals("secure", result.getRiskLevel());
        assertTrue(result.getVulnerabilities().isEmpty());
    }
}

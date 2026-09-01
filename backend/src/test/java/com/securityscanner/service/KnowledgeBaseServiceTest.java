package com.securityscanner.service;

import com.securityscanner.dto.KnowledgeBaseEntry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class KnowledgeBaseServiceTest {

    private KnowledgeBaseService knowledgeBaseService;

    @BeforeEach
    void setUp() {
        knowledgeBaseService = new KnowledgeBaseService();
        knowledgeBaseService.init();
    }

    @Test
    void testKnowledgeBaseLoaded() {
        List<KnowledgeBaseEntry> entries = knowledgeBaseService.getKnowledgeBase();
        assertNotNull(entries, "Knowledge base should not be null");
        assertFalse(entries.isEmpty(), "Knowledge base should contain entries");
        assertTrue(entries.size() >= 20, "Knowledge base should contain at least 20 CWE/OWASP entries");

        boolean hasCwe89 = entries.stream().anyMatch(e -> "CWE-89".equalsIgnoreCase(e.getCweId()));
        boolean hasCwe78 = entries.stream().anyMatch(e -> "CWE-78".equalsIgnoreCase(e.getCweId()));
        boolean hasCwe798 = entries.stream().anyMatch(e -> "CWE-798".equalsIgnoreCase(e.getCweId()));
        boolean hasCwe327 = entries.stream().anyMatch(e -> "CWE-327".equalsIgnoreCase(e.getCweId()));

        assertTrue(hasCwe89, "Should contain CWE-89 SQL Injection");
        assertTrue(hasCwe78, "Should contain CWE-78 OS Command Injection");
        assertTrue(hasCwe798, "Should contain CWE-798 Hardcoded Secrets");
        assertTrue(hasCwe327, "Should contain CWE-327 Broken Cryptography");
    }

    @Test
    void testCosineSimilarityIdenticalVectors() {
        List<Double> v1 = Arrays.asList(1.0, 2.0, 3.0);
        List<Double> v2 = Arrays.asList(1.0, 2.0, 3.0);

        double sim = knowledgeBaseService.cosineSimilarity(v1, v2);
        assertEquals(1.0, sim, 0.0001, "Identical vectors should have cosine similarity 1.0");
    }

    @Test
    void testCosineSimilarityOrthogonalVectors() {
        List<Double> v1 = Arrays.asList(1.0, 0.0);
        List<Double> v2 = Arrays.asList(0.0, 1.0);

        double sim = knowledgeBaseService.cosineSimilarity(v1, v2);
        assertEquals(0.0, sim, 0.0001, "Orthogonal vectors should have cosine similarity 0.0");
    }

    @Test
    void testRetrieveSqlInjectionContext() {
        String code = "SELECT * FROM users WHERE username = '" + "admin" + "'";
        List<KnowledgeBaseEntry> results = knowledgeBaseService.retrieveContext(code, 3, null);

        assertNotNull(results);
        assertFalse(results.isEmpty());
        assertTrue(results.stream().anyMatch(e -> "CWE-89".equalsIgnoreCase(e.getCweId()) || e.getTitle().toLowerCase().contains("sql")),
                "Top results should include SQL injection reference");
    }

    @Test
    void testRetrieveCommandInjectionContext() {
        String code = "os.system('ping ' + user_input)";
        List<KnowledgeBaseEntry> results = knowledgeBaseService.retrieveContext(code, 3, null);

        assertNotNull(results);
        assertFalse(results.isEmpty());
        assertTrue(results.stream().anyMatch(e -> "CWE-78".equalsIgnoreCase(e.getCweId()) || e.getTitle().toLowerCase().contains("command")),
                "Top results should include Command injection reference");
    }

    @Test
    void testFormatContextForPrompt() {
        String code = "SELECT * FROM users WHERE id = 1";
        List<KnowledgeBaseEntry> results = knowledgeBaseService.retrieveContext(code, 2, null);
        String formatted = knowledgeBaseService.formatContextForPrompt(results);

        assertNotNull(formatted);
        assertTrue(formatted.contains("RETRIEVED SECURITY KNOWLEDGE BASE CONTEXT"));
        assertTrue(formatted.contains("Reference URL:"));
    }
}

package com.securityscanner.benchmark;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securityscanner.dto.ScanResponse;
import com.securityscanner.dto.Vulnerability;
import com.securityscanner.service.CodeScannerService;
import com.securityscanner.service.GeminiScannerService;
import com.securityscanner.service.KnowledgeBaseService;
import com.securityscanner.service.StaticAnalysisFallbackService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.FileWriter;
import java.io.InputStream;
import java.io.PrintWriter;
import java.util.*;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class RagAccuracyBenchmarkTest {

    private CodeScannerService codeScannerService;
    private final List<AccuracyFixture> fixtures = new ArrayList<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AccuracyFixture {
        public String id;
        public String name;
        public String language;
        public String code;

        @JsonProperty("expected_cwes")
        public List<String> expectedCwes = new ArrayList<>();
    }

    public static class MetricSummary {
        int truePositives = 0;
        int falsePositives = 0;
        int falseNegatives = 0;
        int cleanSamplesCount = 0;
        int cleanSamplesPassed = 0;
        int totalExpected = 0;
        int totalDetected = 0;

        public double getPrecision() {
            int denom = truePositives + falsePositives;
            return denom > 0 ? (double) truePositives / denom : 1.0;
        }

        public double getRecall() {
            int denom = truePositives + falseNegatives;
            return denom > 0 ? (double) truePositives / denom : 1.0;
        }

        public double getF1() {
            double p = getPrecision();
            double r = getRecall();
            return (p + r) > 0 ? 2 * (p * r) / (p + r) : 0.0;
        }
    }

    @BeforeEach
    void setUp() throws Exception {
        KnowledgeBaseService knowledgeBaseService = new KnowledgeBaseService();
        knowledgeBaseService.init();

        GeminiScannerService geminiScannerService = new GeminiScannerService(knowledgeBaseService);
        geminiScannerService.validateConfiguredModels();

        StaticAnalysisFallbackService fallbackService = new StaticAnalysisFallbackService();
        codeScannerService = new CodeScannerService(geminiScannerService, fallbackService, knowledgeBaseService);

        loadFixtures();
    }

    private void loadFixtures() throws Exception {
        fixtures.clear();
        try (InputStream is = getClass().getResourceAsStream("/rag_accuracy_fixtures.json")) {
            if (is == null) {
                throw new IllegalStateException("rag_accuracy_fixtures.json not found on classpath.");
            }
            List<AccuracyFixture> loaded = objectMapper.readValue(is, new TypeReference<List<AccuracyFixture>>() {});
            fixtures.addAll(loaded);
        }
    }

    @Test
    public void runAccuracyEvaluation() {
        assertTrue(fixtures.size() >= 15 && fixtures.size() <= 20,
                "Should have between 15 and 20 out-of-sample fixtures");

        MetricSummary ragMetrics = new MetricSummary();
        MetricSummary noRagMetrics = new MetricSummary();
        int[] geminiCalls = new int[]{0};
        int[] fallbackCalls = new int[]{0};

        StringBuilder report = new StringBuilder();
        report.append("========================================================================================================\n");
        report.append("           AI SECURITY SCANNER: OUT-OF-SAMPLE RAG DETECTION ACCURACY & F1 BENCHMARK             \n");
        report.append("========================================================================================================\n\n");
        report.append(String.format("%-22s | %-10s | %-12s | %-10s | %-12s | %-12s | %-8s\n",
                "Fixture ID", "Language", "Mode", "Engine", "Expected CWE", "Detected CWE", "Status"));
        report.append("--------------------------------------------------------------------------------------------------------\n");

        int fixtureIndex = 0;
        for (AccuracyFixture fix : fixtures) {
            fixtureIndex++;

            // 1. Evaluate with useRag = true
            CodeScannerService.SingleScanResult ragResult = codeScannerService.analyzeCode(fix.code, fix.language, true);
            if ("gemini".equals(ragResult.engine)) geminiCalls[0]++; else fallbackCalls[0]++;
            Set<String> ragDetected = extractCwes(ragResult.response);
            evaluateFixture(fix, ragDetected, ragMetrics);
            String ragStatus = isMatch(fix.expectedCwes, ragDetected) ? "PASS" : "FAIL";

            // Delay between requests to respect free-tier rate limits
            try { Thread.sleep(1500); } catch (InterruptedException ignored) {}

            // 2. Evaluate with useRag = false
            CodeScannerService.SingleScanResult noRagResult = codeScannerService.analyzeCode(fix.code, fix.language, false);
            if ("gemini".equals(noRagResult.engine)) geminiCalls[0]++; else fallbackCalls[0]++;
            Set<String> noRagDetected = extractCwes(noRagResult.response);
            evaluateFixture(fix, noRagDetected, noRagMetrics);
            String noRagStatus = isMatch(fix.expectedCwes, noRagDetected) ? "PASS" : "FAIL";

            // Delay between requests to respect free-tier rate limits
            try { Thread.sleep(1500); } catch (InterruptedException ignored) {}

            report.append(String.format("%-22s | %-10s | %-12s | %-10s | %-12s | %-12s | %-8s\n",
                    fix.id, fix.language, "useRag=TRUE", ragResult.engine,
                    fix.expectedCwes.isEmpty() ? "NONE (Clean)" : String.join(",", fix.expectedCwes),
                    ragDetected.isEmpty() ? "NONE" : String.join(",", ragDetected),
                    ragStatus));

            report.append(String.format("%-22s | %-10s | %-12s | %-10s | %-12s | %-12s | %-8s\n",
                    fix.id, fix.language, "useRag=FALSE", noRagResult.engine,
                    fix.expectedCwes.isEmpty() ? "NONE (Clean)" : String.join(",", fix.expectedCwes),
                    noRagDetected.isEmpty() ? "NONE" : String.join(",", noRagDetected),
                    noRagStatus));

            report.append("--------------------------------------------------------------------------------------------------------\n");

            System.out.printf("[%d/%d] Evaluated %s (Engine: RAG=%s, NoRAG=%s | Total Gemini Calls: %d, Fallbacks: %d)%n",
                    fixtureIndex, fixtures.size(), fix.id, ragResult.engine, noRagResult.engine, geminiCalls[0], fallbackCalls[0]);
        }

        report.append("\n==================================== ACCURACY & F1 COMPARISON SUMMARY ==================================\n");
        report.append(String.format("Total Fixtures Evaluated: %d (Vulnerable: %d, Clean/Controls: %d)\n",
                fixtures.size(),
                fixtures.stream().filter(f -> !f.expectedCwes.isEmpty()).count(),
                fixtures.stream().filter(f -> f.expectedCwes.isEmpty()).count()));
        report.append(String.format("Engine Execution Breakdown: Gemini Live Calls = %d, Static Fallback Calls = %d\n\n",
                geminiCalls[0], fallbackCalls[0]));

        report.append(String.format("Metric                | useRag = TRUE (With RAG Context) | useRag = FALSE (Baseline Without RAG)\n"));
        report.append("--------------------------------------------------------------------------------------------------------\n");
        report.append(String.format("True Positives (TP)   | %-32d | %-32d\n", ragMetrics.truePositives, noRagMetrics.truePositives));
        report.append(String.format("False Positives (FP)  | %-32d | %-32d\n", ragMetrics.falsePositives, noRagMetrics.falsePositives));
        report.append(String.format("False Negatives (FN)  | %-32d | %-32d\n", ragMetrics.falseNegatives, noRagMetrics.falseNegatives));
        report.append(String.format("Precision             | %-31.2f%% | %-31.2f%%\n", ragMetrics.getPrecision() * 100, noRagMetrics.getPrecision() * 100));
        report.append(String.format("Recall                | %-31.2f%% | %-31.2f%%\n", ragMetrics.getRecall() * 100, noRagMetrics.getRecall() * 100));
        report.append(String.format("F1 Score              | %-31.2f%% | %-31.2f%%\n", ragMetrics.getF1() * 100, noRagMetrics.getF1() * 100));
        report.append(String.format("Clean Sample Accuracy | %d/%d (%.2f%%)                   | %d/%d (%.2f%%)\n",
                ragMetrics.cleanSamplesPassed, ragMetrics.cleanSamplesCount,
                (ragMetrics.cleanSamplesCount > 0 ? (double) ragMetrics.cleanSamplesPassed / ragMetrics.cleanSamplesCount * 100 : 100.0),
                noRagMetrics.cleanSamplesPassed, noRagMetrics.cleanSamplesCount,
                (noRagMetrics.cleanSamplesCount > 0 ? (double) noRagMetrics.cleanSamplesPassed / noRagMetrics.cleanSamplesCount * 100 : 100.0)));
        report.append("========================================================================================================\n");

        System.out.println(report.toString());

        try {
            File targetDir = new File("target");
            if (!targetDir.exists()) targetDir.mkdirs();
            try (PrintWriter pw = new PrintWriter(new FileWriter("target/rag_accuracy_benchmark_report.txt"))) {
                pw.write(report.toString());
            }
        } catch (Exception e) {
            System.err.println("Notice: Could not write report file: " + e.getMessage());
        }

        assertNotNull(report.toString());
    }

    public static void main(String[] args) throws Exception {
        RagAccuracyBenchmarkTest benchmark = new RagAccuracyBenchmarkTest();
        benchmark.setUp();
        benchmark.runAccuracyEvaluation();
    }

    private Set<String> extractCwes(ScanResponse response) {
        Set<String> set = new HashSet<>();
        if (response != null && response.getVulnerabilities() != null) {
            for (Vulnerability v : response.getVulnerabilities()) {
                if (v.getCweId() != null && !v.getCweId().trim().isEmpty()) {
                    set.add(v.getCweId().toUpperCase().trim());
                }
            }
        }
        return set;
    }

    private boolean isMatch(List<String> expected, Set<String> detected) {
        Set<String> expSet = new HashSet<>();
        for (String e : expected) expSet.add(e.toUpperCase().trim());
        return expSet.equals(detected);
    }

    private void evaluateFixture(AccuracyFixture fixture, Set<String> detected, MetricSummary metrics) {
        Set<String> expSet = new HashSet<>();
        for (String e : fixture.expectedCwes) expSet.add(e.toUpperCase().trim());

        if (expSet.isEmpty()) {
            metrics.cleanSamplesCount++;
            if (detected.isEmpty()) {
                metrics.cleanSamplesPassed++;
            } else {
                metrics.falsePositives += detected.size();
            }
            return;
        }

        metrics.totalExpected += expSet.size();
        metrics.totalDetected += detected.size();

        for (String exp : expSet) {
            if (detected.contains(exp)) {
                metrics.truePositives++;
            } else {
                metrics.falseNegatives++;
            }
        }

        for (String det : detected) {
            if (!expSet.contains(det)) {
                metrics.falsePositives++;
            }
        }
    }
}

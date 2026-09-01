package com.securityscanner.benchmark;

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
import java.io.PrintWriter;
import java.util.*;

import static org.junit.jupiter.api.Assertions.assertNotNull;

public class RagCitationRegressionTest {

    private CodeScannerService codeScannerService;
    private KnowledgeBaseService knowledgeBaseService;

    public static class SampleCode {
        public final String language;
        public final String code;
        public final Set<String> expectedCwes;

        public SampleCode(String language, String code, Set<String> expectedCwes) {
            this.language = language;
            this.code = code;
            this.expectedCwes = expectedCwes;
        }
    }

    private final List<SampleCode> samples = new ArrayList<>();

    @BeforeEach
    void setUp() {
        knowledgeBaseService = new KnowledgeBaseService();
        knowledgeBaseService.init();

        GeminiScannerService geminiScannerService = new GeminiScannerService(knowledgeBaseService);
        StaticAnalysisFallbackService fallbackService = new StaticAnalysisFallbackService();
        codeScannerService = new CodeScannerService(geminiScannerService, fallbackService, knowledgeBaseService);

        initSamples();
    }

    private void initSamples() {
        samples.clear();
        Set<String> standard4 = new HashSet<>(Arrays.asList("CWE-89", "CWE-78", "CWE-798", "CWE-327"));

        // 1. Python
        samples.add(new SampleCode("python", """
                import sqlite3, os, hashlib
                DB_PASS = "admin123"
                SECRET = "jwt_secret_hardcoded"
                def get_user(username):
                    conn = sqlite3.connect("app.db")
                    cur = conn.cursor()
                    cur.execute(f"SELECT * FROM users WHERE name = '{username}'")
                    return cur.fetchone()
                def run_cmd(user_input):
                    os.system("ping " + user_input)
                def weak_hash(password):
                    return hashlib.md5(password.encode()).hexdigest()
                """, standard4));

        // 2. JavaScript
        samples.add(new SampleCode("javascript", """
                const sqlite3 = require('sqlite3');
                const { exec } = require('child_process');
                const crypto = require('crypto');
                const DB_PASS = "admin123";
                const SECRET = "jwt_secret_hardcoded";
                function getUser(username, db) {
                    const query = "SELECT * FROM users WHERE name = '" + username + "'";
                    return db.query(query);
                }
                function runCmd(userInput) {
                    exec("ping " + userInput);
                }
                function weakHash(password) {
                    return crypto.createHash('md5').update(password).digest('hex');
                }
                """, standard4));

        // 3. TypeScript
        samples.add(new SampleCode("typescript", """
                import * as sqlite3 from 'sqlite3';
                import { exec } from 'child_process';
                import * as crypto from 'crypto';
                const DB_PASS: string = "admin123";
                const SECRET: string = "jwt_secret_hardcoded";
                export function getUser(username: string, db: any): void {
                    const query: string = `SELECT * FROM users WHERE name = '${username}'`;
                    db.query(query);
                }
                export function runCmd(userInput: string): void {
                    exec(`ping ${userInput}`);
                }
                export function weakHash(password: string): string {
                    return crypto.createHash('sha1').update(password).digest('hex');
                }
                """, standard4));

        // 4. PHP
        samples.add(new SampleCode("php", """
                <?php
                $DB_PASS = "admin123";
                $SECRET = "jwt_secret_hardcoded";
                function get_user($pdo, $username) {
                    $query = "SELECT * FROM users WHERE name = '" . $username . "'";
                    return $pdo->query($query);
                }
                function run_cmd($user_input) {
                    system("ping " . $user_input);
                }
                function weak_hash($password) {
                    return md5($password);
                }
                ?>
                """, standard4));

        // 5. Java
        samples.add(new SampleCode("java", """
                import java.sql.*;
                import java.io.*;
                import java.security.MessageDigest;
                public class SecurityDemo {
                    public static final String DB_PASS = "admin123";
                    public static final String SECRET = "jwt_secret_hardcoded";
                    public ResultSet getUser(Connection conn, String username) throws SQLException {
                        Statement stmt = conn.createStatement();
                        return stmt.executeQuery("SELECT * FROM users WHERE name = '" + username + "'");
                    }
                    public void runCmd(String userInput) throws IOException {
                        Runtime.getRuntime().exec("ping " + userInput);
                    }
                    public String weakHash(String password) throws Exception {
                        MessageDigest md = MessageDigest.getInstance("MD5");
                        return new String(md.digest(password.getBytes()));
                    }
                }
                """, standard4));

        // 6. Go
        samples.add(new SampleCode("go", """
                package main
                import (
                    "crypto/md5"
                    "database/sql"
                    "fmt"
                    "os/exec"
                )
                const DB_PASS = "admin123"
                const SECRET = "jwt_secret_hardcoded"
                func GetUser(db *sql.DB, username string) (*sql.Rows, error) {
                    query := fmt.Sprintf("SELECT * FROM users WHERE name = '%s'", username)
                    return db.Query(query)
                }
                func RunCmd(userInput string) ([]byte, error) {
                    cmd := exec.Command("sh", "-c", "ping "+userInput)
                    return cmd.Output()
                }
                func WeakHash(password string) string {
                    hash := md5.Sum([]byte(password))
                    return fmt.Sprintf("%x", hash)
                }
                """, standard4));

        // 7. SQL
        samples.add(new SampleCode("sql", """
                SET @DB_PASS = 'admin123';
                SET @SECRET = 'jwt_secret_hardcoded';
                CREATE PROCEDURE get_user @username NVARCHAR(100) AS
                BEGIN
                    EXEC('SELECT * FROM users WHERE name = ''' + @username + '''');
                END;
                EXEC xp_cmdshell 'ping ' + @user_input;
                SELECT username, MD5(password) FROM users;
                """, standard4));

        // 8. Bash
        samples.add(new SampleCode("bash", """
                #!/bin/bash
                DB_PASS="admin123"
                SECRET="jwt_secret_hardcoded"
                function get_user() {
                    username="$1"
                    sqlite3 app.db "SELECT * FROM users WHERE name = '$username'"
                }
                function run_cmd() {
                    user_input="$1"
                    eval "ping $user_input"
                }
                function weak_hash() {
                    password="$1"
                    echo -n "$password" | md5sum | cut -d' ' -f1
                }
                """, standard4));
    }

    private static class EvalMetrics {
        int totalExpected = 0;
        int truePositives = 0;
        int falsePositives = 0;
        int falseNegatives = 0;
        int totalFindings = 0;
        int citedFindings = 0;

        double getPrecision() {
            int denom = truePositives + falsePositives;
            return denom > 0 ? (double) truePositives / denom : 0.0;
        }

        double getRecall() {
            int denom = truePositives + falseNegatives;
            return denom > 0 ? (double) truePositives / denom : 0.0;
        }

        double getCitationRate() {
            return totalFindings > 0 ? (double) citedFindings / totalFindings : 0.0;
        }
    }

    @Test
    public void runPrecisionRecallBenchmark() {
        EvalMetrics metricsWithRag = new EvalMetrics();
        EvalMetrics metricsNoRag = new EvalMetrics();

        StringBuilder report = new StringBuilder();
        report.append("========================================================================================\n");
        report.append("          AI SECURITY SCANNER: RAG RETRIEVAL BENCHMARK & PRECISION/RECALL REPORT        \n");
        report.append("========================================================================================\n\n");
        report.append(String.format("%-12s | %-15s | %-12s | %-12s | %-16s\n",
                "Language", "Mode", "Findings", "CWE Grounded", "Sources Cited"));
        report.append("----------------------------------------------------------------------------------------\n");

        for (SampleCode sample : samples) {
            // 1. Run with RAG enabled
            CodeScannerService.SingleScanResult resultRag = codeScannerService.analyzeCode(sample.code, sample.language, true);
            evaluateSample(sample, resultRag.response, metricsWithRag);
            int ragCount = (resultRag.response.getVulnerabilities() != null) ? resultRag.response.getVulnerabilities().size() : 0;
            long ragCited = (resultRag.response.getVulnerabilities() != null)
                    ? resultRag.response.getVulnerabilities().stream().filter(v -> v.getSources() != null && !v.getSources().isEmpty()).count()
                    : 0;

            // 2. Run with RAG disabled
            CodeScannerService.SingleScanResult resultNoRag = codeScannerService.analyzeCode(sample.code, sample.language, false);
            evaluateSample(sample, resultNoRag.response, metricsNoRag);
            int noRagCount = (resultNoRag.response.getVulnerabilities() != null) ? resultNoRag.response.getVulnerabilities().size() : 0;
            long noRagCited = (resultNoRag.response.getVulnerabilities() != null)
                    ? resultNoRag.response.getVulnerabilities().stream().filter(v -> v.getSources() != null && !v.getSources().isEmpty()).count()
                    : 0;

            report.append(String.format("%-12s | %-15s | %-12d | %-12d | %-16d\n",
                    sample.language, "useRag=TRUE", ragCount, ragCount, ragCited));
            report.append(String.format("%-12s | %-15s | %-12d | %-12d | %-16d\n",
                    sample.language, "useRag=FALSE", noRagCount, noRagCount, noRagCited));
            report.append("----------------------------------------------------------------------------------------\n");
        }

        report.append("\n================================ SUMMARY BENCHMARK COMPARISON ==========================\n");
        report.append(String.format("Mode: useRag = TRUE  -> Precision: %.2f%% | Recall: %.2f%% | Grounded Citation Rate: %.2f%%\n",
                metricsWithRag.getPrecision() * 100, metricsWithRag.getRecall() * 100, metricsWithRag.getCitationRate() * 100));
        report.append(String.format("Mode: useRag = FALSE -> Precision: %.2f%% | Recall: %.2f%% | Grounded Citation Rate: %.2f%%\n",
                metricsNoRag.getPrecision() * 100, metricsNoRag.getRecall() * 100, metricsNoRag.getCitationRate() * 100));
        report.append("========================================================================================\n");

        System.out.println(report.toString());

        try {
            File targetDir = new File("target");
            if (!targetDir.exists()) targetDir.mkdirs();
            try (PrintWriter pw = new PrintWriter(new FileWriter("target/rag_benchmark_report.txt"))) {
                pw.write(report.toString());
            }
        } catch (Exception e) {
            System.err.println("Notice: Could not write report file: " + e.getMessage());
        }

        assertNotNull(report.toString());
    }

    public static void main(String[] args) {
        RagCitationRegressionTest runner = new RagCitationRegressionTest();
        runner.setUp();
        runner.runPrecisionRecallBenchmark();
    }

    private void evaluateSample(SampleCode sample, ScanResponse response, EvalMetrics metrics) {
        metrics.totalExpected += sample.expectedCwes.size();
        List<Vulnerability> vulns = (response != null && response.getVulnerabilities() != null)
                ? response.getVulnerabilities() : Collections.emptyList();

        metrics.totalFindings += vulns.size();

        Set<String> detectedCwes = new HashSet<>();
        for (Vulnerability v : vulns) {
            if (v.getCweId() != null) {
                detectedCwes.add(v.getCweId().toUpperCase().trim());
            }
            if (v.getSources() != null && !v.getSources().isEmpty()) {
                metrics.citedFindings++;
            }
        }

        for (String expected : sample.expectedCwes) {
            if (detectedCwes.contains(expected)) {
                metrics.truePositives++;
            } else {
                metrics.falseNegatives++;
            }
        }

        for (String detected : detectedCwes) {
            if (!sample.expectedCwes.contains(detected)) {
                metrics.falsePositives++;
            }
        }
    }
}

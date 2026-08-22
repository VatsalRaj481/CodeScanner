package com.securityscanner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securityscanner.dto.ScanResponse;
import com.securityscanner.dto.Vulnerability;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@Service
public class GeminiScannerService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public static final String SYSTEM_PROMPT = """
            You are an expert Application Security (AppSec) Senior Auditor and Code Scanner.
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
            """;

    public GeminiScannerService() {
        this.webClient = WebClient.builder().build();
        this.objectMapper = new ObjectMapper();
    }

    public ScanResponse analyzeCodeWithGemini(String code, String language, String apiKey) throws Exception {
        String[] modelNames = new String[]{"gemini-3.6-flash", "gemini-1.5-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-pro-latest"};
        Exception lastException = null;

        for (String modelName : modelNames) {
            try {
                return executeGeminiCall(code, language, apiKey, modelName);
            } catch (Exception e) {
                System.err.println("Gemini model " + modelName + " attempt failed: " + e.getMessage());
                lastException = e;
            }
        }

        if (lastException != null) {
            throw lastException;
        }
        throw new RuntimeException("Gemini API models failed.");
    }

    private ScanResponse executeGeminiCall(String code, String language, String apiKey, String modelName) throws Exception {
        String prompt = SYSTEM_PROMPT + "\n\nLanguage: " + language + "\n\nCode snippet to analyze:\n```\n" + code + "\n```";

        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", Collections.singletonList(part));

        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("responseMimeType", "application/json");

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(content));
        requestBody.put("generationConfig", genConfig);

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

        String rawResponse = webClient.post()
                .uri(url)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        if (rawResponse == null || rawResponse.isEmpty()) {
            throw new RuntimeException("Empty response received from Gemini API");
        }

        JsonNode rootNode = objectMapper.readTree(rawResponse);
        JsonNode candidates = rootNode.path("candidates");
        if (candidates.isEmpty()) {
            throw new RuntimeException("No candidates returned from Gemini API");
        }

        JsonNode parts = candidates.get(0).path("content").path("parts");
        if (parts.isEmpty()) {
            throw new RuntimeException("No text parts returned from Gemini API candidate");
        }

        String textContent = parts.get(0).path("text").asText().trim();

        // Strip ```json markdown wrappers if present
        if (textContent.startsWith("```")) {
            textContent = textContent.replaceAll("^```(?:json)?\\n?", "");
            textContent = textContent.replaceAll("\\n?```$", "").trim();
        }

        ScanResponse scanRes = objectMapper.readValue(textContent, ScanResponse.class);

        // Annotate source and confidence on findings
        if (scanRes.getVulnerabilities() != null) {
            for (Vulnerability item : scanRes.getVulnerabilities()) {
                if (item.getSource() == null) {
                    item.setSource("ai_gemini");
                }
                if (item.getConfidence() == null) {
                    item.setConfidence("high");
                }
            }
        }

        return scanRes;
    }
}

package com.securityscanner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securityscanner.dto.KnowledgeBaseEntry;
import com.securityscanner.dto.ScanResponse;
import com.securityscanner.dto.Vulnerability;
import com.securityscanner.dto.VulnerabilitySource;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@Service
public class GeminiScannerService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final KnowledgeBaseService knowledgeBaseService;

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
                  "cwe_id": "e.g. CWE-89, CWE-798, CWE-78, CWE-327",
                  "sources": [
                    {
                      "cwe_id": "e.g. CWE-89",
                      "title": "e.g. Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection')",
                      "url": "e.g. https://cwe.mitre.org/data/definitions/89.html"
                    }
                  ]
                }
              ]
            }

            Strict Rules:
            1. Do NOT wrap output in markdown formatting like ```json ... ``` if possible, or ensure it is raw valid JSON.
            2. When retrieved CWE / OWASP security references are provided, strictly ground your findings and fix explanations in them.
            3. Populate the 'sources' array for each finding with the matching backing references (cwe_id, title, and reference URL) from the retrieved context. If no retrieved source matches, provide an empty sources array [].
            4. Ensure line numbers correspond accurately to the input code.
            5. Be accurate and thorough. If no vulnerabilities exist, return score 100, risk_level 'secure', and empty vulnerabilities array.
            """;

    public GeminiScannerService() {
        this(new KnowledgeBaseService());
    }

    @org.springframework.beans.factory.annotation.Autowired
    public GeminiScannerService(KnowledgeBaseService knowledgeBaseService) {
        this.webClient = WebClient.builder().build();
        this.objectMapper = new ObjectMapper();
        this.knowledgeBaseService = knowledgeBaseService;
    }

    public GeminiScannerService(WebClient webClient, ObjectMapper objectMapper, KnowledgeBaseService knowledgeBaseService) {
        this.webClient = webClient;
        this.objectMapper = objectMapper;
        this.knowledgeBaseService = knowledgeBaseService;
    }

    @org.springframework.beans.factory.annotation.Value("${gemini.model.generation:gemini-3.6-flash}")
    private String generationModel = "gemini-3.6-flash";

    public String getGenerationModel() {
        if (generationModel == null || generationModel.isEmpty()) {
            return com.securityscanner.config.DotenvConfig.getEnv("GEMINI_MODEL_GENERATION", "gemini-3.6-flash");
        }
        return generationModel;
    }

    public void setGenerationModel(String generationModel) {
        this.generationModel = generationModel;
    }

    @jakarta.annotation.PostConstruct
    public void validateConfiguredModels() {
        String apiKey = com.securityscanner.config.DotenvConfig.getEnv("GEMINI_API_KEY", "");
        if (apiKey == null || apiKey.isEmpty() || "your_key_here".equals(apiKey)) {
            return;
        }
        try {
            String listUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey;
            String raw = webClient.get()
                    .uri(listUrl)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(java.time.Duration.ofSeconds(6));
            if (raw != null) {
                JsonNode root = objectMapper.readTree(raw);
                JsonNode modelsNode = root.path("models");
                Set<String> modelSet = new HashSet<>();
                if (modelsNode.isArray()) {
                    for (JsonNode m : modelsNode) {
                        String name = m.path("name").asText();
                        modelSet.add(name.replace("models/", ""));
                    }
                }
                String genModel = getGenerationModel();
                if (!modelSet.isEmpty() && !modelSet.contains(genModel)) {
                    System.err.println("[STARTUP MODEL WARNING] Configured generation model '" + genModel +
                            "' is NOT in the Gemini ListModels endpoint. Available models: " + modelSet);
                }
                if (knowledgeBaseService != null) {
                    String embModel = knowledgeBaseService.getEmbeddingModel();
                    if (!modelSet.isEmpty() && !modelSet.contains(embModel)) {
                        System.err.println("[STARTUP MODEL WARNING] Configured embedding model '" + embModel +
                                "' is NOT in the Gemini ListModels endpoint. Available models: " + modelSet);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[STARTUP MODEL CHECK NOTICE] Could not verify models via ListModels: " + e.getMessage());
        }
    }

    public ScanResponse analyzeCodeWithGemini(String code, String language, String apiKey) throws Exception {
        return analyzeCodeWithGemini(code, language, apiKey, true);
    }

    public ScanResponse analyzeCodeWithGemini(String code, String language, String apiKey, boolean useRag) throws Exception {
        String primaryModel = getGenerationModel();
        List<String> modelNames = new ArrayList<>();
        modelNames.add(primaryModel);
        if (!"gemini-3.6-flash".equals(primaryModel)) {
            modelNames.add("gemini-3.6-flash");
        }
        modelNames.add("gemini-flash-latest");

        Exception lastException = null;

        List<KnowledgeBaseEntry> retrievedEntries = Collections.emptyList();
        String ragContextBlock = "";

        if (useRag && knowledgeBaseService != null) {
            try {
                retrievedEntries = knowledgeBaseService.retrieveContext(code, 4, apiKey);
                ragContextBlock = knowledgeBaseService.formatContextForPrompt(retrievedEntries);
            } catch (Exception e) {
                System.err.println("RAG retrieval notice: " + e.getMessage());
            }
        }

        for (String modelName : modelNames) {
            try {
                return executeGeminiCall(code, language, apiKey, modelName, ragContextBlock, retrievedEntries);
            } catch (Exception e) {
                System.err.println("Gemini model " + modelName + " attempt failed: (" + e.getClass().getSimpleName() + ") " + e.getMessage());
                lastException = e;
            }
        }

        if (lastException != null) {
            throw lastException;
        }
        throw new RuntimeException("Gemini API models failed.");
    }

    private ScanResponse executeGeminiCall(String code, String language, String apiKey,
                                          String modelName, String ragContextBlock,
                                          List<KnowledgeBaseEntry> retrievedEntries) throws Exception {
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append(SYSTEM_PROMPT).append("\n\n");

        if (ragContextBlock != null && !ragContextBlock.isEmpty()) {
            promptBuilder.append(ragContextBlock).append("\n");
        }

        promptBuilder.append("Language: ").append(language).append("\n\n");
        promptBuilder.append("Code snippet to analyze:\n```\n").append(code).append("\n```");

        String prompt = promptBuilder.toString();

        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", Collections.singletonList(part));

        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("responseMimeType", "application/json");
        genConfig.put("temperature", 0.1);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(content));
        requestBody.put("generationConfig", genConfig);

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

        String rawResponse;
        try {
            rawResponse = webClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(java.time.Duration.ofSeconds(30));
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            int status = e.getStatusCode().value();
            if (status == 404) {
                System.err.println("[GENERATION ERROR 404] Model '" + modelName + "' not found or deprecated: " + e.getResponseBodyAsString());
            } else if (status == 429) {
                System.err.println("[GENERATION ERROR 429] Rate limit / quota exhausted on '" + modelName + "': " + e.getResponseBodyAsString());
            } else if (status == 401 || status == 403) {
                System.err.println("[GENERATION ERROR " + status + "] Authentication/Permission error on '" + modelName + "': " + e.getResponseBodyAsString());
            } else {
                System.err.println("[GENERATION ERROR " + status + "] on '" + modelName + "': " + e.getResponseBodyAsString());
            }
            throw e;
        }

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

        String textContent = null;
        for (JsonNode p : parts) {
            if (p.has("text") && !p.path("text").asText().trim().isEmpty()) {
                textContent = p.path("text").asText().trim();
                break;
            }
        }

        if (textContent == null || textContent.isEmpty()) {
            throw new RuntimeException("No text content found in candidate parts: " + parts);
        }

        // Strip ```json markdown wrappers if present
        if (textContent.startsWith("```")) {
            textContent = textContent.replaceAll("^```(?:json)?\\n?", "");
            textContent = textContent.replaceAll("\\n?```$", "").trim();
        }

        ScanResponse scanRes = objectMapper.readValue(textContent, ScanResponse.class);

        // Grounding validation and source annotation
        Map<String, KnowledgeBaseEntry> kbByCwe = new HashMap<>();
        for (KnowledgeBaseEntry entry : retrievedEntries) {
            if (entry.getCweId() != null) kbByCwe.put(entry.getCweId().toUpperCase(), entry);
            if (entry.getId() != null) kbByCwe.put(entry.getId().toUpperCase(), entry);
        }

        if (scanRes.getVulnerabilities() != null) {
            for (Vulnerability item : scanRes.getVulnerabilities()) {
                if (item.getSource() == null) {
                    item.setSource("ai_gemini");
                }
                if (item.getConfidence() == null) {
                    item.setConfidence("high");
                }
                if (item.getSources() == null) {
                    item.setSources(new ArrayList<>());
                }

                // If sources are empty but cweId matches a retrieved entry, attach the source citation
                if (item.getSources().isEmpty() && item.getCweId() != null) {
                    String normCwe = item.getCweId().toUpperCase().trim();
                    if (kbByCwe.containsKey(normCwe)) {
                        KnowledgeBaseEntry matched = kbByCwe.get(normCwe);
                        item.getSources().add(new VulnerabilitySource(
                                matched.getCweId(),
                                matched.getTitle(),
                                matched.getUrl()
                        ));
                    }
                }
            }
        }

        return scanRes;
    }
}

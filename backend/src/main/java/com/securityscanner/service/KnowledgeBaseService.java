package com.securityscanner.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securityscanner.dto.KnowledgeBaseEntry;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class KnowledgeBaseService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final List<KnowledgeBaseEntry> knowledgeBase = new ArrayList<>();
    private final Map<String, List<Double>> entryEmbeddings = new HashMap<>();

    public KnowledgeBaseService() {
        this.webClient = WebClient.builder().build();
        this.objectMapper = new ObjectMapper();
        loadKnowledgeBase();
    }

    public KnowledgeBaseService(WebClient webClient, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.objectMapper = objectMapper;
        loadKnowledgeBase();
    }

    @PostConstruct
    public void init() {
        loadKnowledgeBase();
    }

    public synchronized void loadKnowledgeBase() {
        knowledgeBase.clear();
        entryEmbeddings.clear();
        try (InputStream is = getClass().getResourceAsStream("/cwe_owasp_knowledge_base.json")) {
            if (is == null) {
                System.err.println("Warning: cwe_owasp_knowledge_base.json not found on classpath.");
                return;
            }
            List<KnowledgeBaseEntry> entries = objectMapper.readValue(is, new TypeReference<List<KnowledgeBaseEntry>>() {});
            knowledgeBase.addAll(entries);

            for (KnowledgeBaseEntry entry : knowledgeBase) {
                if (entry.getEmbedding() != null && !entry.getEmbedding().isEmpty()) {
                    entryEmbeddings.put(entry.getId(), entry.getEmbedding());
                } else {
                    // Generate pseudo-vector representation based on n-gram token hashing
                    List<Double> pseudoVec = computePseudoEmbedding(entry.toSearchableText());
                    entry.setEmbedding(pseudoVec);
                    entryEmbeddings.put(entry.getId(), pseudoVec);
                }
            }
            System.out.println("KnowledgeBaseService: Loaded " + knowledgeBase.size() + " CWE/OWASP reference entries.");
        } catch (Exception e) {
            System.err.println("Failed to load knowledge base: " + e.getMessage());
        }
    }

    public List<KnowledgeBaseEntry> getKnowledgeBase() {
        return Collections.unmodifiableList(knowledgeBase);
    }

    @org.springframework.beans.factory.annotation.Value("${gemini.model.embedding:gemini-embedding-001}")
    private String embeddingModel = "gemini-embedding-001";

    public String getEmbeddingModel() {
        if (embeddingModel == null || embeddingModel.isEmpty()) {
            return com.securityscanner.config.DotenvConfig.getEnv("GEMINI_MODEL_EMBEDDING", "gemini-embedding-001");
        }
        return embeddingModel;
    }

    public void setEmbeddingModel(String embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    public List<KnowledgeBaseEntry> retrieveContext(String code, int topK, String apiKey) {
        if (knowledgeBase.isEmpty()) {
            loadKnowledgeBase();
        }
        if (knowledgeBase.isEmpty()) {
            return Collections.emptyList();
        }

        List<Double> queryEmbedding = null;
        if (apiKey != null && !apiKey.isEmpty() && !"your_key_here".equals(apiKey)) {
            try {
                queryEmbedding = fetchGeminiEmbedding(code, apiKey);
            } catch (Exception e) {
                System.err.println("Gemini " + getEmbeddingModel() + " call failed, falling back to lexical similarity: " + e.getMessage());
            }
        }

        int limit = (topK > 0) ? topK : 4;
        final List<Double> finalQueryVector = queryEmbedding;

        // Compute hybrid scores (cosine similarity + lexical matching boost)
        List<ScoredEntry> scored = new ArrayList<>();
        for (KnowledgeBaseEntry entry : knowledgeBase) {
            List<Double> docVec = entryEmbeddings.get(entry.getId());
            double sim = (docVec != null) ? cosineSimilarity(finalQueryVector, docVec) : 0.0;
            double lexScore = computeLexicalMatchScore(code, entry);
            double totalScore = (sim * 0.6) + (lexScore * 0.4);
            scored.add(new ScoredEntry(entry, totalScore));
        }

        scored.sort((a, b) -> Double.compare(b.score, a.score));

        return scored.stream()
                .limit(limit)
                .map(s -> s.entry)
                .collect(Collectors.toList());
    }

    public List<Double> fetchGeminiEmbedding(String text, String apiKey) throws Exception {
        String truncatedText = (text.length() > 2048) ? text.substring(0, 2048) : text;
        String model = getEmbeddingModel();
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":embedContent?key=" + apiKey;

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", truncatedText);

        Map<String, Object> contentMap = new HashMap<>();
        contentMap.put("parts", Collections.singletonList(textPart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "models/" + model);
        requestBody.put("content", contentMap);

        String rawResponse;
        try {
            rawResponse = webClient.post()
                    .uri(url)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(java.time.Duration.ofSeconds(5));
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
            int status = e.getStatusCode().value();
            if (status == 404) {
                System.err.println("[EMBEDDING ERROR 404] Model '" + model + "' not found or deprecated: " + e.getResponseBodyAsString());
            } else if (status == 429) {
                System.err.println("[EMBEDDING ERROR 429] Rate limit / quota exhausted on '" + model + "': " + e.getResponseBodyAsString());
            } else if (status == 401 || status == 403) {
                System.err.println("[EMBEDDING ERROR " + status + "] Authentication/Permission error on '" + model + "': " + e.getResponseBodyAsString());
            } else {
                System.err.println("[EMBEDDING ERROR " + status + "] on '" + model + "': " + e.getResponseBodyAsString());
            }
            throw e;
        }

        if (rawResponse == null || rawResponse.isEmpty()) {
            throw new RuntimeException("Empty response received from " + model);
        }

        JsonNode root = objectMapper.readTree(rawResponse);
        JsonNode valuesNode = root.path("embedding").path("values");
        if (valuesNode.isEmpty() || !valuesNode.isArray()) {
            throw new RuntimeException("No embedding values array in response from " + model);
        }

        List<Double> values = new ArrayList<>();
        for (JsonNode val : valuesNode) {
            values.add(val.asDouble());
        }
        return values;
    }

    public double cosineSimilarity(List<Double> v1, List<Double> v2) {
        if (v1 == null || v2 == null || v1.isEmpty() || v2.isEmpty()) {
            return 0.0;
        }
        int minSize = Math.min(v1.size(), v2.size());
        double dot = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < minSize; i++) {
            double a = v1.get(i);
            double b = v2.get(i);
            dot += a * b;
            normA += a * a;
            normB += b * b;
        }

        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public double computeLexicalMatchScore(String code, KnowledgeBaseEntry entry) {
        if (code == null || entry == null) return 0.0;
        String lowerCode = code.toLowerCase();
        String entryId = (entry.getId() != null) ? entry.getId().toLowerCase() : "";
        String title = (entry.getTitle() != null) ? entry.getTitle().toLowerCase() : "";
        String desc = (entry.getDescription() != null) ? entry.getDescription().toLowerCase() : "";

        double score = 0.0;

        // Specific security keywords check
        if (entryId.contains("89") || title.contains("sql") || desc.contains("sql")) {
            if (lowerCode.contains("select") || lowerCode.contains("insert") || lowerCode.contains("from") ||
                lowerCode.contains("where") || lowerCode.contains("query") || lowerCode.contains("execute")) {
                score += 1.0;
            }
        }

        if (entryId.contains("78") || title.contains("os command") || desc.contains("os command")) {
            if (lowerCode.contains("os.system") || lowerCode.contains("exec(") || lowerCode.contains("exec `") ||
                lowerCode.contains("system(") || lowerCode.contains("exec.command") || lowerCode.contains("xp_cmdshell") ||
                lowerCode.contains("ping") || lowerCode.contains("runtime.getruntime")) {
                score += 1.0;
            }
        }

        if (entryId.contains("798") || title.contains("hard-coded") || desc.contains("credentials")) {
            if (lowerCode.contains("db_pass") || lowerCode.contains("secret") || lowerCode.contains("admin123") ||
                lowerCode.contains("jwt_secret") || lowerCode.contains("password")) {
                score += 1.0;
            }
        }

        if (entryId.contains("327") || title.contains("cryptographic") || desc.contains("broken")) {
            if (lowerCode.contains("md5") || lowerCode.contains("sha1") || lowerCode.contains("md5sum") ||
                lowerCode.contains("messagedigest") || lowerCode.contains("hashlib")) {
                score += 1.0;
            }
        }

        if (entryId.contains("79") || title.contains("cross-site scripting") || title.contains("xss")) {
            if (lowerCode.contains("<script") || lowerCode.contains("innerhtml") || lowerCode.contains("document.write")) {
                score += 1.0;
            }
        }

        if (entryId.contains("22") || title.contains("path traversal")) {
            if (lowerCode.contains("../") || lowerCode.contains("..\\") || lowerCode.contains("filepath") || lowerCode.contains("filename")) {
                score += 0.8;
            }
        }

        if (entryId.contains("94") || title.contains("code injection")) {
            if (lowerCode.contains("eval(") || lowerCode.contains("function(")) {
                score += 1.0;
            }
        }

        return Math.min(1.0, score);
    }

    public List<Double> computePseudoEmbedding(String text) {
        int dimensions = 128;
        double[] vec = new double[dimensions];
        if (text == null || text.isEmpty()) {
            return Arrays.stream(vec).boxed().collect(Collectors.toList());
        }

        String[] tokens = text.toLowerCase().split("[^a-zA-Z0-9_#@-]+");
        for (String token : tokens) {
            if (token.isEmpty()) continue;
            int hash = Math.abs(token.hashCode());
            int idx = hash % dimensions;
            vec[idx] += 1.0;

            // Bigrams
            if (token.length() > 3) {
                int hash2 = Math.abs((token + "_ext").hashCode());
                vec[hash2 % dimensions] += 0.5;
            }
        }

        // L2 normalize
        double norm = 0.0;
        for (double v : vec) norm += v * v;
        norm = Math.sqrt(norm);
        if (norm > 0) {
            for (int i = 0; i < dimensions; i++) {
                vec[i] /= norm;
            }
        }

        return Arrays.stream(vec).boxed().collect(Collectors.toList());
    }

    public String formatContextForPrompt(List<KnowledgeBaseEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("--- RETRIEVED SECURITY KNOWLEDGE BASE CONTEXT (CWE / OWASP REFERENCE STANDARDS) ---\n");
        sb.append("The following vetted security references are retrieved from the knowledge base as relevant context for this code:\n\n");

        for (int i = 0; i < entries.size(); i++) {
            KnowledgeBaseEntry e = entries.get(i);
            sb.append(String.format("[Source %d] %s: %s\n", i + 1, e.getCweId(), e.getTitle()));
            sb.append(String.format("Category: %s\n", e.getCategory()));
            sb.append(String.format("Reference URL: %s\n", e.getUrl()));
            sb.append(String.format("Description: %s\n", e.getDescription()));
            sb.append(String.format("Remediation Guidance: %s\n", e.getRemediation()));
            if (e.getSnippet() != null && !e.getSnippet().isEmpty()) {
                sb.append(String.format("Secure Pattern: %s\n", e.getSnippet()));
            }
            sb.append("\n");
        }
        sb.append("-----------------------------------------------------------------------------------\n");
        return sb.toString();
    }

    private static class ScoredEntry {
        final KnowledgeBaseEntry entry;
        final double score;

        ScoredEntry(KnowledgeBaseEntry entry, double score) {
            this.entry = entry;
            this.score = score;
        }
    }
}

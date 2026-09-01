package com.securityscanner.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.securityscanner.config.DotenvConfig;
import com.securityscanner.dto.*;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class CodeScannerService {

    private final GeminiScannerService geminiScannerService;
    private final StaticAnalysisFallbackService fallbackService;
    private final KnowledgeBaseService knowledgeBaseService;
    private final Cache<String, CacheEntry> scanCache;

    public static class CacheEntry {
        public final ScanResponse response;
        public final String engine;

        public CacheEntry(ScanResponse response, String engine) {
            this.response = response;
            this.engine = engine;
        }
    }

    public static class SingleScanResult {
        public final ScanResponse response;
        public final String engine;
        public final boolean cached;

        public SingleScanResult(ScanResponse response, String engine, boolean cached) {
            this.response = response;
            this.engine = engine;
            this.cached = cached;
        }
    }

    public CodeScannerService(GeminiScannerService geminiScannerService,
                              StaticAnalysisFallbackService fallbackService) {
        this(geminiScannerService, fallbackService, new KnowledgeBaseService());
    }

    public CodeScannerService(GeminiScannerService geminiScannerService,
                              StaticAnalysisFallbackService fallbackService,
                              KnowledgeBaseService knowledgeBaseService) {
        this.geminiScannerService = geminiScannerService;
        this.fallbackService = fallbackService;
        this.knowledgeBaseService = knowledgeBaseService;

        long ttlSeconds = 3600;
        try {
            ttlSeconds = Long.parseLong(DotenvConfig.getEnv("CACHE_TTL_SECONDS", "3600"));
        } catch (Exception ignored) {}

        this.scanCache = Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(ttlSeconds, TimeUnit.SECONDS)
                .build();
    }

    public String computeCodeHash(String code, String language) {
        return computeCodeHash(code, language, true);
    }

    public String computeCodeHash(String code, String language, boolean useRag) {
        try {
            String input = ((language != null ? language : "auto") + ":" +
                    (code != null ? code.trim() : "") + ":rag=" + useRag);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return String.valueOf(Objects.hash(code, language, useRag));
        }
    }

    public SingleScanResult analyzeCode(String code, String language) {
        return analyzeCode(code, language, true);
    }

    public SingleScanResult analyzeCode(String code, String language, boolean useRag) {
        String codeHash = computeCodeHash(code, language, useRag);
        CacheEntry cached = scanCache.getIfPresent(codeHash);
        if (cached != null) {
            return new SingleScanResult(cached.response, cached.engine, true);
        }

        String apiKey = DotenvConfig.getEnv("GEMINI_API_KEY", "");
        if (apiKey == null || apiKey.isEmpty() || "your_key_here".equals(apiKey)) {
            ScanResponse res = fallbackService.analyzeCode(code, language);
            if (useRag && res.getVulnerabilities() != null) {
                enrichWithSources(res.getVulnerabilities());
            }
            scanCache.put(codeHash, new CacheEntry(res, "fallback"));
            return new SingleScanResult(res, "fallback", false);
        }

        try {
            ScanResponse res = geminiScannerService.analyzeCodeWithGemini(code, language, apiKey, useRag);
            scanCache.put(codeHash, new CacheEntry(res, "gemini"));
            return new SingleScanResult(res, "gemini", false);
        } catch (Exception e) {
            System.err.println("Gemini API analysis error/fallback triggered: " + e.getMessage());
            ScanResponse res = fallbackService.analyzeCode(code, language);
            if (useRag && res.getVulnerabilities() != null) {
                enrichWithSources(res.getVulnerabilities());
            }
            if (res.getVulnerabilities() == null || res.getVulnerabilities().isEmpty()) {
                res.setError("AI analysis notice: " + e.getMessage());
            }
            scanCache.put(codeHash, new CacheEntry(res, "fallback"));
            return new SingleScanResult(res, "fallback", false);
        }
    }

    public SingleScanResult analyzeBatch(List<FileItem> files) {
        return analyzeBatch(files, true);
    }

    public SingleScanResult analyzeBatch(List<FileItem> files, boolean useRag) {
        List<FileScanResult> fileResults = new ArrayList<>();
        List<Vulnerability> allVulns = new ArrayList<>();
        int totalLoc = 0;
        double weightedScoreSum = 0;
        boolean anyCached = false;
        Set<String> usedEngines = new HashSet<>();

        Map<String, Integer> severityRank = new HashMap<>();
        severityRank.put("critical", 4);
        severityRank.put("high", 3);
        severityRank.put("medium", 2);
        severityRank.put("low", 1);
        severityRank.put("info", 0);
        severityRank.put("secure", 0);

        int worstRank = 0;

        for (FileItem fileItem : files) {
            String filename = (fileItem.getFilename() != null) ? fileItem.getFilename() : "unnamed_file";
            String code = (fileItem.getCode() != null) ? fileItem.getCode() : "";
            String language = (fileItem.getLanguage() != null) ? fileItem.getLanguage() : "auto";

            SingleScanResult singleResult = analyzeCode(code, language, useRag);
            if (singleResult.cached) {
                anyCached = true;
            }
            usedEngines.add(singleResult.engine);

            ScanResponse res = singleResult.response;
            if (res.getVulnerabilities() != null) {
                for (Vulnerability v : res.getVulnerabilities()) {
                    Vulnerability copy = new Vulnerability(
                            v.getId(), v.getSeverity(), v.getTitle(), v.getCategory(),
                            v.getLineNumbers(), v.getDescription(), v.getWhyRisky(),
                            v.getFixCode(), v.getFixExplanation(), v.getCweId(),
                            filename, v.getSource(), v.getConfidence(),
                            v.getSources()
                    );
                    allVulns.add(copy);
                }
            }

            int loc = Math.max(1, code.split("\\r?\\n").length);
            totalLoc += loc;
            weightedScoreSum += res.getScore() * loc;

            String riskLevelKey = (res.getRiskLevel() != null) ? res.getRiskLevel().toLowerCase() : "secure";
            int rank = severityRank.getOrDefault(riskLevelKey, 0);
            if (rank > worstRank) {
                worstRank = rank;
            }

            fileResults.add(new FileScanResult(
                    filename,
                    res.getScore(),
                    res.getRiskLevel(),
                    res.getVulnerabilities()
            ));
        }

        int overallScore = (totalLoc > 0) ? (int) Math.round(weightedScoreSum / totalLoc) : 100;

        Map<Integer, String> rankToLevel = new HashMap<>();
        rankToLevel.put(4, "critical");
        rankToLevel.put(3, "high");
        rankToLevel.put(2, "medium");
        rankToLevel.put(1, "low");
        rankToLevel.put(0, "secure");

        String overallRiskLevel = rankToLevel.getOrDefault(worstRank, "secure");
        String compositeEngine = usedEngines.contains("gemini") ? "gemini" : "fallback";

        ScanResponse batchResponse = new ScanResponse(
                overallScore,
                overallRiskLevel,
                allVulns,
                null,
                files.size(),
                fileResults
        );

        return new SingleScanResult(batchResponse, compositeEngine, anyCached);
    }

    private void enrichWithSources(List<Vulnerability> vulns) {
        if (vulns == null || knowledgeBaseService == null) return;
        List<KnowledgeBaseEntry> kbList = knowledgeBaseService.getKnowledgeBase();
        if (kbList == null || kbList.isEmpty()) return;

        Map<String, KnowledgeBaseEntry> kbMap = new HashMap<>();
        for (KnowledgeBaseEntry entry : kbList) {
            if (entry.getCweId() != null) kbMap.put(entry.getCweId().toUpperCase().trim(), entry);
            if (entry.getId() != null) kbMap.put(entry.getId().toUpperCase().trim(), entry);
        }

        for (Vulnerability v : vulns) {
            if (v.getSources() == null) {
                v.setSources(new ArrayList<>());
            }
            if (v.getSources().isEmpty() && v.getCweId() != null) {
                String cwe = v.getCweId().toUpperCase().trim();
                if (kbMap.containsKey(cwe)) {
                    KnowledgeBaseEntry entry = kbMap.get(cwe);
                    v.getSources().add(new VulnerabilitySource(
                            entry.getCweId(),
                            entry.getTitle(),
                            entry.getUrl()
                    ));
                }
            }
        }
    }
}

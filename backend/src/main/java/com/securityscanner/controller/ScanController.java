package com.securityscanner.controller;

import com.securityscanner.dto.*;
import com.securityscanner.service.CodeScannerService;
import com.securityscanner.util.StructuredLogger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
public class ScanController {

    private final CodeScannerService codeScannerService;
    private final StructuredLogger logger;

    public ScanController(CodeScannerService codeScannerService, StructuredLogger logger) {
        this.codeScannerService = codeScannerService;
        this.logger = logger;
    }

    @GetMapping("/")
    public Map<String, String> readRoot() {
        Map<String, String> res = new HashMap<>();
        res.put("status", "online");
        res.put("service", "AI Security Scanner Backend");
        return res;
    }

    @GetMapping("/health")
    public Map<String, String> healthCheck() {
        Map<String, String> res = new HashMap<>();
        res.put("status", "healthy");
        return res;
    }

    @PostMapping("/api/scan")
    public ResponseEntity<?> scanCode(@RequestBody(required = false) ScanRequest scanReq) {
        if (scanReq == null || scanReq.getCode() == null || scanReq.getCode().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("Source code cannot be empty."));
        }

        long startTime = System.nanoTime();
        try {
            CodeScannerService.SingleScanResult result = codeScannerService.analyzeCode(
                    scanReq.getCode(), scanReq.getLanguage()
            );
            double durationMs = (System.nanoTime() - startTime) / 1_000_000.0;
            int findingCount = (result.response.getVulnerabilities() != null) ? result.response.getVulnerabilities().size() : 0;

            logger.logScanEvent("single_scan", durationMs, result.engine, findingCount, result.cached);
            return ResponseEntity.ok(result.response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Internal scanning error: " + e.getMessage()));
        }
    }

    @PostMapping("/api/scan-batch")
    public ResponseEntity<?> scanBatch(@RequestBody(required = false) BatchScanRequest batchReq) {
        if (batchReq == null || batchReq.getFiles() == null || batchReq.getFiles().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse("File list cannot be empty."));
        }

        long startTime = System.nanoTime();
        try {
            CodeScannerService.SingleScanResult result = codeScannerService.analyzeBatch(batchReq.getFiles());
            double durationMs = (System.nanoTime() - startTime) / 1_000_000.0;
            int findingCount = (result.response.getVulnerabilities() != null) ? result.response.getVulnerabilities().size() : 0;

            logger.logScanEvent("batch_scan", durationMs, result.engine, findingCount, result.cached);
            return ResponseEntity.ok(result.response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Batch scanning error: " + e.getMessage()));
        }
    }
}

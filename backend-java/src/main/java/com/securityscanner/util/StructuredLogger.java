package com.securityscanner.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class StructuredLogger {

    private static final Logger logger = LoggerFactory.getLogger("security_scanner");
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public void logScanEvent(String eventType, double durationMs, String engine, int findingCount, boolean cached) {
        try {
            Map<String, Object> logPayload = new LinkedHashMap<>();
            logPayload.put("timestamp", DateTimeFormatter.ISO_INSTANT.format(Instant.now()));
            logPayload.put("event", eventType);
            logPayload.put("duration_ms", Math.round(durationMs * 100.0) / 100.0);
            logPayload.put("engine", engine);
            logPayload.put("finding_count", findingCount);
            logPayload.put("cached", cached);

            logger.info(objectMapper.writeValueAsString(logPayload));
        } catch (Exception e) {
            logger.error("Failed to format scan log event", e);
        }
    }
}

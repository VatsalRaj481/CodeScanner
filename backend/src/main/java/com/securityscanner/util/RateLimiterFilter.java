package com.securityscanner.util;

import com.securityscanner.config.DotenvConfig;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimiterFilter implements Filter {

    private final Map<String, ClientRateLimit> clientLimits = new ConcurrentHashMap<>();

    private static class ClientRateLimit {
        final AtomicInteger count = new AtomicInteger(0);
        volatile long resetTime = System.currentTimeMillis() + 60000;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();
        if ("/api/scan".equals(path) || "/api/scan-batch".equals(path)) {
            String clientIp = httpRequest.getRemoteAddr();
            int limitPerMinute = 10;
            try {
                limitPerMinute = Integer.parseInt(DotenvConfig.getEnv("RATE_LIMIT_PER_MINUTE", "10"));
            } catch (Exception ignored) {}

            ClientRateLimit rateLimit = clientLimits.computeIfAbsent(clientIp, k -> new ClientRateLimit());
            long now = System.currentTimeMillis();

            synchronized (rateLimit) {
                if (now > rateLimit.resetTime) {
                    rateLimit.count.set(0);
                    rateLimit.resetTime = now + 60000;
                }

                if (rateLimit.count.incrementAndGet() > limitPerMinute) {
                    httpResponse.setStatus(429);
                    httpResponse.setContentType("application/json");
                    httpResponse.getWriter().write("{\"detail\": \"Rate limit exceeded\"}");
                    return;
                }
            }
        }

        chain.doFilter(request, response);
    }
}

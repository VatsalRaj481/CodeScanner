package com.securityscanner.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
public class DotenvConfig {

    @PostConstruct
    public void init() {
        try {
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()
                    .load();
            dotenv.entries().forEach(entry -> {
                if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
        } catch (Exception e) {
            // Ignore if .env is missing or invalid
        }
    }

    public static String getEnv(String key, String defaultValue) {
        String sysProp = System.getProperty(key);
        if (sysProp != null && !sysProp.isEmpty()) {
            return sysProp;
        }
        String envVar = System.getenv(key);
        if (envVar != null && !envVar.isEmpty()) {
            return envVar;
        }
        try {
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            String val = dotenv.get(key);
            if (val != null && !val.isEmpty()) {
                return val;
            }
        } catch (Exception ignored) {}
        return defaultValue;
    }
}

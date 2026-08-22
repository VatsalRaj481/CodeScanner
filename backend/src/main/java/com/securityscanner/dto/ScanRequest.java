package com.securityscanner.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ScanRequest {
    private String code;
    private String language = "auto";

    public ScanRequest() {}

    public ScanRequest(String code, String language) {
        this.code = code;
        if (language != null) {
            this.language = language;
        }
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = (language != null) ? language : "auto";
    }
}

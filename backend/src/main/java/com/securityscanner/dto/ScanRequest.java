package com.securityscanner.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ScanRequest {
    private String code;
    private String language = "auto";

    @JsonProperty("use_rag")
    private Boolean useRag = true;

    public ScanRequest() {}

    public ScanRequest(String code, String language) {
        this(code, language, true);
    }

    public ScanRequest(String code, String language, Boolean useRag) {
        this.code = code;
        if (language != null) {
            this.language = language;
        }
        if (useRag != null) {
            this.useRag = useRag;
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

    @JsonProperty("use_rag")
    public Boolean getUseRag() {
        return useRag;
    }

    @JsonProperty("use_rag")
    public void setUseRag(Boolean useRag) {
        this.useRag = (useRag != null) ? useRag : true;
    }

    public boolean isUseRag() {
        return useRag == null || useRag;
    }
}

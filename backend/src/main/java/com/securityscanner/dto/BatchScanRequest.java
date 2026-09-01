package com.securityscanner.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class BatchScanRequest {
    private List<FileItem> files;

    @JsonProperty("use_rag")
    private Boolean useRag = true;

    public BatchScanRequest() {}

    public BatchScanRequest(List<FileItem> files) {
        this(files, true);
    }

    public BatchScanRequest(List<FileItem> files, Boolean useRag) {
        this.files = files;
        if (useRag != null) {
            this.useRag = useRag;
        }
    }

    public List<FileItem> getFiles() { return files; }
    public void setFiles(List<FileItem> files) { this.files = files; }

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


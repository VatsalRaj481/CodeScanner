package com.securityscanner.dto;

import java.util.List;

public class BatchScanRequest {
    private List<FileItem> files;

    public BatchScanRequest() {}

    public BatchScanRequest(List<FileItem> files) {
        this.files = files;
    }

    public List<FileItem> getFiles() { return files; }
    public void setFiles(List<FileItem> files) { this.files = files; }
}

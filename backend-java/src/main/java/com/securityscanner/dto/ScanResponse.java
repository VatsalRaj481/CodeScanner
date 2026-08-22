package com.securityscanner.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScanResponse {
    private int score;

    @JsonProperty("risk_level")
    private String riskLevel;

    private List<Vulnerability> vulnerabilities = new ArrayList<>();
    private String error;

    @JsonProperty("total_files")
    private Integer totalFiles;

    @JsonProperty("file_results")
    private List<FileScanResult> fileResults;

    public ScanResponse() {}

    public ScanResponse(int score, String riskLevel, List<Vulnerability> vulnerabilities) {
        this.score = score;
        this.riskLevel = riskLevel;
        this.vulnerabilities = (vulnerabilities != null) ? vulnerabilities : new ArrayList<>();
    }

    public ScanResponse(int score, String riskLevel, List<Vulnerability> vulnerabilities,
                        String error, Integer totalFiles, List<FileScanResult> fileResults) {
        this.score = score;
        this.riskLevel = riskLevel;
        this.vulnerabilities = (vulnerabilities != null) ? vulnerabilities : new ArrayList<>();
        this.error = error;
        this.totalFiles = totalFiles;
        this.fileResults = fileResults;
    }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public List<Vulnerability> getVulnerabilities() { return vulnerabilities; }
    public void setVulnerabilities(List<Vulnerability> vulnerabilities) {
        this.vulnerabilities = (vulnerabilities != null) ? vulnerabilities : new ArrayList<>();
    }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public Integer getTotalFiles() { return totalFiles; }
    public void setTotalFiles(Integer totalFiles) { this.totalFiles = totalFiles; }

    public List<FileScanResult> getFileResults() { return fileResults; }
    public void setFileResults(List<FileScanResult> fileResults) { this.fileResults = fileResults; }
}

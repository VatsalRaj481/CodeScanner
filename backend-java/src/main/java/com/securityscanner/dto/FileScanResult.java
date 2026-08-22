package com.securityscanner.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public class FileScanResult {
    private String filename;
    private int score;

    @JsonProperty("risk_level")
    private String riskLevel;

    private List<Vulnerability> vulnerabilities = new ArrayList<>();

    public FileScanResult() {}

    public FileScanResult(String filename, int score, String riskLevel, List<Vulnerability> vulnerabilities) {
        this.filename = filename;
        this.score = score;
        this.riskLevel = riskLevel;
        this.vulnerabilities = (vulnerabilities != null) ? vulnerabilities : new ArrayList<>();
    }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public List<Vulnerability> getVulnerabilities() { return vulnerabilities; }
    public void setVulnerabilities(List<Vulnerability> vulnerabilities) {
        this.vulnerabilities = (vulnerabilities != null) ? vulnerabilities : new ArrayList<>();
    }
}

package com.securityscanner.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class KnowledgeBaseEntry {
    private String id;

    @JsonProperty("cwe_id")
    private String cweId;

    private String title;
    private String category;
    private String description;
    private String remediation;
    private String snippet;
    private String url;
    private List<Double> embedding;

    public KnowledgeBaseEntry() {}

    public KnowledgeBaseEntry(String id, String cweId, String title, String category,
                              String description, String remediation, String snippet,
                              String url, List<Double> embedding) {
        this.id = id;
        this.cweId = cweId;
        this.title = title;
        this.category = category;
        this.description = description;
        this.remediation = remediation;
        this.snippet = snippet;
        this.url = url;
        this.embedding = embedding;
    }

    public String getId() { return id != null ? id : cweId; }
    public void setId(String id) { this.id = id; }

    public String getCweId() { return cweId != null ? cweId : id; }
    public void setCweId(String cweId) { this.cweId = cweId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRemediation() { return remediation; }
    public void setRemediation(String remediation) { this.remediation = remediation; }

    public String getSnippet() { return snippet; }
    public void setSnippet(String snippet) { this.snippet = snippet; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public List<Double> getEmbedding() { return embedding; }
    public void setEmbedding(List<Double> embedding) { this.embedding = embedding; }

    public String toSearchableText() {
        StringBuilder sb = new StringBuilder();
        if (cweId != null) sb.append(cweId).append(" ");
        if (title != null) sb.append(title).append(" ");
        if (category != null) sb.append(category).append(" ");
        if (description != null) sb.append(description).append(" ");
        if (remediation != null) sb.append(remediation).append(" ");
        if (snippet != null) sb.append(snippet);
        return sb.toString();
    }
}

package com.securityscanner.dto;

public class FileItem {
    private String filename;
    private String code;
    private String language = "auto";

    public FileItem() {}

    public FileItem(String filename, String code, String language) {
        this.filename = filename;
        this.code = code;
        if (language != null) {
            this.language = language;
        }
    }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) {
        this.language = (language != null) ? language : "auto";
    }
}

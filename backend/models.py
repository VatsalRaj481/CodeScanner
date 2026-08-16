from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class ScanRequest(BaseModel):
    code: str = Field(..., description="Source code to analyze")
    language: str = Field("auto", description="Programming language of the source code")

class Vulnerability(BaseModel):
    id: str = Field(..., description="Unique ID for the vulnerability")
    severity: Literal["critical", "high", "medium", "low", "info"] = Field(..., description="Severity level")
    title: str = Field(..., description="Short title of the vulnerability")
    category: str = Field(..., description="Security category e.g. Injection, Cryptography, Secrets")
    line_numbers: List[int] = Field(default_factory=list, description="Line numbers where vulnerability resides")
    description: str = Field(..., description="Detailed description of the issue")
    why_risky: str = Field(..., description="Explanation of why this issue poses a risk")
    fix_code: str = Field(..., description="Corrected code block snippet")
    fix_explanation: str = Field(..., description="Explanation of how the fix resolves the risk")
    cwe_id: str = Field(..., description="CWE identification e.g. CWE-89")
    filename: Optional[str] = Field(None, description="Source filename for multi-file audits")
    source: Optional[Literal["ai_gemini", "static_fallback"]] = Field(None, description="Detection engine source")
    confidence: Optional[Literal["high", "medium", "low"]] = Field(None, description="Confidence assessment")

class ScanResponse(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall security score from 0 (unsafe) to 100 (secure)")
    risk_level: Literal["critical", "high", "medium", "low", "secure"] = Field(..., description="Overall risk level assessment")
    vulnerabilities: List[Vulnerability] = Field(default_factory=list, description="List of detected vulnerabilities")
    error: str | None = Field(None, description="Error message if scanning encounters an issue")
    total_files: Optional[int] = Field(None, description="Total number of files in batch scan")
    file_results: Optional[List['FileScanResult']] = Field(None, description="Per-file scan breakdown")

class FileItem(BaseModel):
    filename: str = Field(..., description="Name of the file e.g. auth.py")
    code: str = Field(..., description="Source code content")
    language: str = Field("auto", description="Programming language")

class BatchScanRequest(BaseModel):
    files: List[FileItem] = Field(..., description="List of code files to scan in batch")

class FileScanResult(BaseModel):
    filename: str
    score: int
    risk_level: Literal["critical", "high", "medium", "low", "secure"]
    vulnerabilities: List[Vulnerability]

ScanResponse.update_forward_refs()

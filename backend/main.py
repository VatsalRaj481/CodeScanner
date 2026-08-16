import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from models import ScanRequest, ScanResponse, BatchScanRequest
from scanner import analyze_code, analyze_batch

app = FastAPI(
    title="AI Security Scanner API",
    description="Backend service providing automated code vulnerability analysis powered by Google Gemini AI.",
    version="1.0.0"
)

# Enable CORS for public access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "service": "AI Security Scanner Backend"}

@app.post("/api/scan", response_model=ScanResponse)
def scan_code(request: ScanRequest):
    if not request.code or not request.code.strip():
        raise HTTPException(status_code=400, detail="Source code cannot be empty.")
    
    try:
        result = analyze_code(request.code, request.language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal scanning error: {str(e)}")

@app.post("/api/scan-batch", response_model=ScanResponse)
def scan_batch(request: BatchScanRequest):
    if not request.files:
        raise HTTPException(status_code=400, detail="File list cannot be empty.")
    
    try:
        result = analyze_batch(request.files)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch scanning error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


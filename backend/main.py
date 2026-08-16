import os
import time
import json
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

from models import ScanRequest, ScanResponse, BatchScanRequest
from scanner import analyze_code, analyze_batch

# Structured JSON Logger
logger = logging.getLogger("security_scanner")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(message)s'))
    logger.addHandler(handler)

def log_scan_event(event_type: str, duration_ms: float, engine: str, finding_count: int, cached: bool):
    log_payload = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "event": event_type,
        "duration_ms": round(duration_ms, 2),
        "engine": engine,
        "finding_count": finding_count,
        "cached": cached,
    }
    logger.info(json.dumps(log_payload))

rate_limit = os.getenv("RATE_LIMIT_PER_MINUTE", "10")
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{rate_limit}/minute"])

app = FastAPI(
    title="AI Security Scanner API",
    description="Backend service providing automated code vulnerability analysis powered by Google Gemini AI.",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
@limiter.limit(f"{rate_limit}/minute")
def scan_code(req: Request, request: ScanRequest):
    if not request.code or not request.code.strip():
        raise HTTPException(status_code=400, detail="Source code cannot be empty.")
    
    start_time = time.time()
    try:
        result, engine, cached = analyze_code(request.code, request.language)
        duration_ms = (time.time() - start_time) * 1000
        finding_count = len(result.vulnerabilities) if result.vulnerabilities else 0
        log_scan_event("single_scan", duration_ms, engine, finding_count, cached)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal scanning error: {str(e)}")

@app.post("/api/scan-batch", response_model=ScanResponse)
@limiter.limit(f"{rate_limit}/minute")
def scan_batch(req: Request, request: BatchScanRequest):
    if not request.files:
        raise HTTPException(status_code=400, detail="File list cannot be empty.")
    
    start_time = time.time()
    try:
        result, engine, cached = analyze_batch(request.files)
        duration_ms = (time.time() - start_time) * 1000
        finding_count = len(result.vulnerabilities) if result.vulnerabilities else 0
        log_scan_event("batch_scan", duration_ms, engine, finding_count, cached)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch scanning error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)



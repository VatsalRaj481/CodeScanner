import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from models import ScanRequest, ScanResponse
from scanner import analyze_code

app = FastAPI(
    title="AI Security Scanner API",
    description="Backend service providing automated code vulnerability analysis powered by Google Gemini AI.",
    version="1.0.0"
)

# Enable CORS for frontend running on localhost:5173
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

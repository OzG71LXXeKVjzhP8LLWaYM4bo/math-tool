"""
IB Quiz Python Microservice

Provides Math solving (SymPy) endpoints.
OCR is handled by Gemini Vision in the Rust backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import solve

app = FastAPI(
    title="IB Quiz Python Service",
    description="Math solver microservice",
    version="0.1.0",
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(solve.router, prefix="/solve", tags=["Solver"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "0.1.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

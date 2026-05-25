from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers.solver import router as solver_router

# --- API entry point ---
app = FastAPI(
    title="LP-Ops API",
    description="API para resolver problemas dinámicos de programación lineal.",
    version="1.0.0",
)

# Allow requests from the React frontend (localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Simple health check endpoint
@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


# Mount the solver routes under /api
app.include_router(solver_router, prefix="/api")

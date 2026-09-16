from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .routes import gex, health, interpret, scenario, history

app = FastAPI(
    title="GEX Dashboard API",
    description="Gamma Exposure computation and analysis",
    version="1.0.0",
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(gex.router)
app.include_router(interpret.router)
app.include_router(scenario.router)
app.include_router(history.router)

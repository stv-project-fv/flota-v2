from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, vehicles, movements, fuel, fluids, maintenance, parts, audits, schedules, qr, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title="GI Flota v2 API",
    description="API para gestión de flota vehicular municipal",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(movements.router)
app.include_router(fuel.router)
app.include_router(fluids.router)
app.include_router(maintenance.router)
app.include_router(parts.router)
app.include_router(audits.router)
app.include_router(schedules.router)
app.include_router(qr.router)
app.include_router(reports.router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}

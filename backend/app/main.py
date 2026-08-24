import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.core.database import engine, get_db
from backend.app.core.opensearch import log_storage
from backend.app.api.auth import router as auth_router
from backend.app.api.logs import router as logs_router
from backend.app.api.alerts import router as alerts_router
from backend.app.api.devices import router as devices_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.rules import router as rules_router
from backend.app.api.users import router as users_router
from backend.app.api.audit import router as audit_router
from backend.app.utils.seed_data import seed_database_and_logs
from backend.app.utils.syslog_server import start_syslog_server

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("logintel.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed database and baseline data
    logger.info("Initializing LogIntel database, detection rules, and seed data...")
    seed_database_and_logs()

    # Start background Syslog listener
    try:
        await start_syslog_server()
    except Exception as e:
        logger.warning(f"Syslog listener startup skipped: {e}")

    yield

    logger.info("LogIntel backend shutting down...")


app = FastAPI(
    title="LogIntel API",
    description="Centralized Log Intelligence & Security Monitoring Platform REST API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(logs_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(devices_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(rules_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)


@app.get("/")
def root_endpoint():
    return {
        "app": "LogIntel",
        "tagline": "Centralized Log Intelligence & Security Monitoring Platform",
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "operational"
    }


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for container orchestrators and monitoring tools."""
    storage_health = log_storage.get_health_status()
    return {
        "status": "healthy",
        "project": "LogIntel",
        "environment": settings.ENVIRONMENT,
        "database": "connected",
        "log_storage": storage_health
    }

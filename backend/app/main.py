from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.proxy_headers import ProxyHeadersMiddleware
from app.core.config import settings
import os

# Import all routers
from app.api.endpoints import auth
from app.api.endpoints import farmers
from app.api.endpoints import transporters
from app.api.endpoints import collections
from app.api.endpoints import notifications
from app.api.endpoints import admin

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Add proxy headers middleware for Railway (fixes HTTPS redirects)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# Middleware to force HTTPS scheme for all generated URLs
@app.middleware("http")
async def set_https_scheme(request: Request, call_next):
    request.scope["scheme"] = "https"
    response = await call_next(request)
    return response

# CORS - Get allowed origins from environment variable
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(farmers.router, prefix="/api/farmers", tags=["Farmers"])
app.include_router(transporters.router, prefix="/api/transporters", tags=["Transporters"])
app.include_router(collections.router, prefix="/api/collections", tags=["Collections"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(admin.router, prefix="/api/admin", tags=["Administration"])

@app.get("/")
async def root():
    return {
        "message": "🐄 Cheptiret Farmers Cooperative MVP API",
        "version": settings.VERSION,
        "status": "operational",
        "docs": "/api/docs",
        "endpoints": {
            "auth": "/api/auth",
            "farmers": "/api/farmers",
            "transporters": "/api/transporters",
            "collections": "/api/collections",
            "notifications": "/api/notifications",
            "admin": "/api/admin"
        }
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01"}
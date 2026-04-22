from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
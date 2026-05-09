from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from .db import engine, Base
from .config import get_settings
from .modules import auth, employees, inventory, leave, admin, work_logs, profile
from .utils.auth import get_current_user
from .models import User

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault("Cache-Control", "no-store")
        if not settings.DEBUG:
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts_list)
if not settings.DEBUG:
    app.add_middleware(HTTPSRedirectMiddleware)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables at startup
@app.on_event("startup")
def on_startup():
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("Database connection successful and tables created/verified")
    except Exception as e:
        print(f"Database connection error: {e}")

# Include routers
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(inventory.router)
app.include_router(leave.router)
app.include_router(admin.router)
app.include_router(work_logs.router)
app.include_router(profile.router)

@app.get("/")
def root():
    """Root endpoint - provides API information"""
    return {
        "message": settings.APP_NAME,
        "version": "0.1.0",
        "docs": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": "/openapi.json"
        },
        "endpoints": {
            "auth": "/auth",
            "employees": "/api/employees",
            "inventory": "/api/inventory",
            "leaves": "/api/leaves",
            "admin": "/admin",
            "health": "/health"
        },
        "note": "This is an API server. Visit /docs for interactive API documentation."
    }

@app.get("/health")
def health():
    return {"status": "ok", "service": settings.APP_NAME}

# Dashboard endpoint (example)
@app.get("/dashboard")
def dashboard(current_user: User = Depends(get_current_user)):
    return {"message": f"Welcome {current_user.name}", "role": current_user.role}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)

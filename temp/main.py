import logging
import asyncio
from datetime import datetime

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.database import connect_to_database, disconnect_from_database
from app.api.endpoints.authentication import router as auth_router
from app.schemas.auth import ValidationErrorResponse

import app.models.session  # ensure models are imported for cleanup task


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------

limiter = Limiter(key_func=get_remote_address)


# ---------------------------------------------------------------------------
# Background cleanup task
# ---------------------------------------------------------------------------

async def periodic_cleanup():
    """
    Periodic cleanup of expired tokens and sessions.
    Runs every hour.
    """
    from app.models.email_verification import EmailVerificationToken
    from app.models.password_reset import PasswordResetToken
    from app.models.session import Session

    while True:
        try:
            await asyncio.sleep(3600)

            await EmailVerificationToken.cleanup_expired_tokens()
            await PasswordResetToken.cleanup_expired_tokens()

            now = datetime.utcnow()
            # Mark expired sessions as inactive
            await Session.find(Session.expires_at < now).update(
                {"$set": {"is_active": False}}
            )

            logger.info("Periodic cleanup completed")

        except Exception as e:
            logger.error(f"Cleanup task failed: {e}")


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

async def lifespan(app: FastAPI):
    """
    FastAPI lifespan function (async generator).
    Handles startup and shutdown events.
    """
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    cleanup_task = None

    try:
        # Startup: connect to DB
        await connect_to_database()
        logger.info("Database connected successfully")

        # Start background cleanup task
        cleanup_task = asyncio.create_task(periodic_cleanup())

        # Yield control back to FastAPI (app is running)
        yield

    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise

    finally:
        logger.info("Shutting down application")

        if cleanup_task:
            cleanup_task.cancel()
            try:
                await cleanup_task
            except asyncio.CancelledError:
                pass

        await disconnect_from_database()
        logger.info("Application shutdown complete")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Production-grade FastAPI backend for arthSarthi AI with MongoDB integration",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,  # <<< IMPORTANT: pass the function, not lifespan()
)

# SlowAPI integration
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Trusted hosts (production)
if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            "backend.arthsarthi.arqai.tech",
            "arthsarthi.arqai.tech",
            "arqai.tech",
            "localhost",
            "127.0.0.1",
        ],
    )

# CORS
cors_origins = ["http://localhost:3000"]
if settings.is_production:
    cors_origins += ["https://arthsarthi.arqai.tech"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Middlewares
# ---------------------------------------------------------------------------

@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Add basic security headers."""
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    if settings.is_production:
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

    return response


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Log all requests and responses."""
    start_time = asyncio.get_event_loop().time()
    logger.info(
        f"Request: {request.method} {request.url.path} "
        f"from {request.client.host if request.client else 'unknown'}"
    )

    response = await call_next(request)

    process_time = asyncio.get_event_loop().time() - start_time
    logger.info(f"Response: {response.status_code} processed in {process_time:.4f}s")

    return response


# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    field_errors = {}
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"][1:])  # skip 'body'
        field_errors.setdefault(field, []).append(error["msg"])

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ValidationErrorResponse(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            field_errors=field_errors,
        ).dict(),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    payload = {
        "message": exc.detail if isinstance(exc.detail, str) else "HTTP error",
        "status": exc.status_code,
        "code": "HTTP_ERROR",
        "details": exc.detail if isinstance(exc.detail, dict) else {},
    }
    return JSONResponse(
        status_code=exc.status_code,
        content=jsonable_encoder(payload),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.exception("Unhandled exception")
    payload = {
        "message": "Internal server error",
        "code": "INTERNAL_SERVER_ERROR",
    }
    return JSONResponse(status_code=500, content=jsonable_encoder(payload))


# ---------------------------------------------------------------------------
# Health & root endpoints
# ---------------------------------------------------------------------------

@app.get("/health", summary="Health check", description="Check application health")
@limiter.limit("10/minute")
async def health_check(request: Request):
    """Health check endpoint."""
    try:
        # import lazily to avoid circular imports
        from app.core.database import db_manager

        db_health = await db_manager.health_check()

        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": settings.app_version,
            "environment": settings.environment,
            "database": db_health,
            "services": {
                "email": "healthy",
                "auth": "healthy",
            },
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "error": str(e)},
        )


@app.get("/", summary="API Information", description="Get API information")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "description": "Production-grade FastAPI backend for arthSarthi AI Assistant",
        "docs_url": "/docs" if settings.debug else None,
        "health_url": "/health",
    }


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth_router, prefix="/api/v1")

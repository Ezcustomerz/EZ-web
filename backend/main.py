from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from api.advocate import advocate_router
from api.client import client_router
from api.creative import creative_router
from api.user import user_router
from api.invite import invite_router
from api.notifications import notifications_router
from api.booking import booking_router
from api.booking.booking_router import service_main_router
from api.auth import auth_router
from api.stripe import stripe_router
from api.file_scanning.file_scanning_router import router as file_scanning_router
from api.payment_requests.payment_requests_router import router as payment_requests_router
from api.subscriptions import subscriptions
from api.contact import contact_router
from core.limiter import limiter
from core.verify import jwt_auth_middleware
# Import database module to trigger connection test
from db import db_session
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS configuration - MUST be added before other middleware
# Note: When allow_credentials=True, we cannot use allow_origins=["*"]
# We must specify explicit origins
# Get environment type from environment variable (dev, dev_deploy, prod, etc.)
ENV = os.getenv("ENV", "dev").lower()

# Log CORS configuration for debugging
import logging
logger = logging.getLogger(__name__)

# CORS origins configuration via ALLOWED_ORIGINS environment variable (comma-separated)
# ALLOWED_ORIGINS should be set for all environments (dev, dev_deploy, prod)
ALLOWED_ORIGINS_STR = os.getenv("ALLOWED_ORIGINS")
if ALLOWED_ORIGINS_STR:
    # If ALLOWED_ORIGINS is explicitly set, use it and split by comma
    ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",") if origin.strip()]
    logger.info(f"Using ALLOWED_ORIGINS from environment variable: {ALLOWED_ORIGINS}")
elif ENV == "dev":
    # Local development: minimal fallback to localhost for convenience
    # In production, ALLOWED_ORIGINS should always be set
    ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]
    logger.warning(f"ALLOWED_ORIGINS not set for ENV='{ENV}'. Using localhost fallback. Set ALLOWED_ORIGINS in .env for proper configuration.")
elif ENV == "prod" or ENV == "production":
    # Production MUST have ALLOWED_ORIGINS set - fail if not set
    logger.error("ENV is 'prod' but ALLOWED_ORIGINS is not set! CORS will not work correctly.")
    # Fallback to empty list to prevent wildcard access
    ALLOWED_ORIGINS = []
else:
    # For dev_deploy or any other environment, require ALLOWED_ORIGINS to be set
    logger.error(f"ALLOWED_ORIGINS not set for ENV='{ENV}'. CORS will not work correctly. Please set ALLOWED_ORIGINS in your environment.")
    ALLOWED_ORIGINS = []

if ENV != "prod" and ENV != "production":
    logger.info(f"CORS Configuration - ENV: {ENV}, Allowed Origins: {ALLOWED_ORIGINS}")

# Add other middleware first (JWT, SlowAPI)
# These will run AFTER CORS due to FastAPI's reverse middleware order
app.middleware("http")(jwt_auth_middleware)
app.add_middleware(SlowAPIMiddleware)
app.state.limiter = limiter

# Add CORS middleware LAST - In FastAPI, middleware runs in reverse order
# (last added runs first), so adding CORS last ensures it runs FIRST
# This is critical for handling OPTIONS preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Explicit origins required when credentials=True
    allow_credentials=True,  # Required for HttpOnly cookies
    allow_methods=["*"],  # Allow all HTTP methods including OPTIONS
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(creative_router.router)
app.include_router(client_router.router)
app.include_router(advocate_router.router)
app.include_router(invite_router.router)
app.include_router(notifications_router.router)
app.include_router(booking_router.router)
app.include_router(service_main_router)  # Service endpoints at /api/booking
app.include_router(stripe_router.router, prefix="/stripe", tags=["stripe"])
app.include_router(payment_requests_router, prefix="/api/payment-requests", tags=["payment-requests"])
app.include_router(subscriptions.router, prefix="/api", tags=["subscriptions"])
app.include_router(file_scanning_router)
app.include_router(contact_router.router)

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/")
async def read_root():
    # Test database connection and return status
    try:
        # Test connection with a simple operation
        session = db_session.db_client.auth.get_session()
        return {
            "message": "API is running!",
            "database_status": "✅ Connected",
            "database_connection": "successful"
        }
    except Exception as e:
        return {
            "message": "API is running", 
            "database_status": "❌ Disconnected",
            "database_connection": "failed",
            "error": str(e)
        }
 
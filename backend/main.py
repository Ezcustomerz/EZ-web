from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from api.advocate import advocate_router
from api.client import client_router
from api.creative import creative_router
from api.user import user_router
from api import invite
from api import bookings
from routers import booking
from core.limiter import limiter
from api import auth
from core.verify import jwt_auth_middleware
# Import database module to trigger connection test
from db import db_session
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.middleware("http")(jwt_auth_middleware)
app.add_middleware(SlowAPIMiddleware)
app.state.limiter = limiter

# CORS configuration
# Note: When allow_credentials=True, we cannot use allow_origins=["*"]
# We must specify explicit origins
# Get allowed origins from environment or use defaults for development
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,https://localhost:3000,https://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Explicit origins required when credentials=True
    allow_credentials=True,  # Required for HttpOnly cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(user_router.router)
app.include_router(creative_router.router)
app.include_router(client_router.router)
app.include_router(advocate_router.router)
app.include_router(invite.router)
app.include_router(bookings.router, prefix="/api/bookings", tags=["bookings"])
app.include_router(booking.router)

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
 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from utils.limiter import limiter
from routers import auth
from utils.verify import jwt_auth_middleware
# Import database module to trigger connection test
from db import db_session

app = FastAPI()

app.middleware("http")(jwt_auth_middleware)
app.add_middleware(SlowAPIMiddleware)
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

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
 
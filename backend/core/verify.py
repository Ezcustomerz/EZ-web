from fastapi import Request
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

    
async def jwt_auth_middleware(request: Request, call_next):
    """
    Authentication middleware that checks for JWT tokens in:
    1. HttpOnly cookies (preferred for security)
    2. Authorization header (fallback for compatibility)
    
    Skips authentication for OPTIONS preflight requests to allow CORS to work properly.
    """
    # Skip JWT verification for OPTIONS preflight requests (CORS handles these)
    if request.method == "OPTIONS":
        return await call_next(request)
    
    token = None
    user = None

    # First, try to get token from HttpOnly cookie (more secure)
    token = request.cookies.get("sb-access-token")
    
    # Fallback to Authorization header for backward compatibility
    if not token:
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ")[1]

    if token:
        try:
            user = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        except JWTError:
            # Token is invalid or expired - don't set user
            pass

    request.state.user = user  # Always set it (None if no valid token)
    return await call_next(request)

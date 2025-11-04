from fastapi import Request, HTTPException, Depends
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from typing import Dict, Any

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Dependency function that requires authentication.
    Raises HTTPException if user is not authenticated.
    Use with FastAPI's Depends() to protect routes.
    
    Example:
        @router.get("/protected")
        async def protected_route(current_user: Dict = Depends(get_current_user)):
            user_id = current_user.get('sub')
            ...
    """
    if not request.state.user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_id = request.state.user.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    return request.state.user

# Alias for backward compatibility
require_auth = get_current_user

    
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

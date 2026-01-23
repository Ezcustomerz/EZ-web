from fastapi import Request, HTTPException, Depends
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from typing import Dict, Any
import logging
import base64
import json

load_dotenv()

logger = logging.getLogger(__name__)
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# Warn if JWT secret is not configured
if not SUPABASE_JWT_SECRET:
    logger.error("SUPABASE_JWT_SECRET is not configured! JWT validation will fail.")

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
        if not SUPABASE_JWT_SECRET:
            logger.error("SUPABASE_JWT_SECRET not configured - cannot validate JWT tokens")
        else:
            try:
                user = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
                # Store token for reuse in dependencies (avoids redundant extraction)
                request.state.token = token
            except JWTError as e:
                # Log the actual error for debugging (but don't expose to client)
                error_msg = str(e)
                # Only log for non-OPTIONS requests to reduce noise
                if request.method != "OPTIONS":
                    # Decode JWT header to see what algorithm it claims to use
                    try:
                        parts = token.split('.')
                        if len(parts) >= 1:
                            # Decode header (add padding if needed)
                            header_b64 = parts[0]
                            # Add padding if needed
                            padding = 4 - len(header_b64) % 4
                            if padding != 4:
                                header_b64 += '=' * padding
                            header_json = base64.urlsafe_b64decode(header_b64)
                            header = json.loads(header_json)
                            token_alg = header.get('alg', 'unknown')
                            logger.error(f"JWT validation failed: {error_msg} | Token algorithm: {token_alg} | Expected: HS256 | Path: {request.url.path}")
                            if token_alg != 'HS256':
                                logger.error(f"Token uses algorithm '{token_alg}' but we're only allowing HS256. This may indicate a Supabase configuration issue.")
                            elif "alg value is not allowed" in error_msg.lower():
                                logger.error(f"JWT secret mismatch detected! The SUPABASE_JWT_SECRET in your environment doesn't match the production Supabase project. Update it in Render environment variables.")
                    except Exception as decode_error:
                        logger.warning(f"Could not decode JWT header for debugging: {decode_error}")
                        logger.warning(f"JWT validation failed: {error_msg} (path: {request.url.path})")
                # Token is invalid or expired - don't set user
                pass

    request.state.user = user  # Always set it (None if no valid token)
    return await call_next(request)

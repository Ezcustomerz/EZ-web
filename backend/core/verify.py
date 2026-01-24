from fastapi import Request, HTTPException, Depends
from jose import jwt, JWTError
from jose.utils import base64url_decode
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import logging
import base64
import json
import httpx
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

load_dotenv()

logger = logging.getLogger(__name__)
SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_URL:
    logger.error("SUPABASE_URL not configured - ES256 JWKS fetching will fail")
    raise ValueError("SUPABASE_URL environment variable is required for ES256 JWT validation")

# Cache for JWKS (public keys for ES256)
_jwks_cache: Optional[Dict] = None
_jwks_cache_time: Optional[float] = None
JWKS_CACHE_TTL = 3600  # Cache for 1 hour

def get_jwks() -> Dict:
    """
    Fetch JWKS (JSON Web Key Set) from Supabase for ES256 token validation.
    Caches the result for 1 hour.
    """
    global _jwks_cache, _jwks_cache_time
    import time
    
    # Return cached JWKS if still valid
    if _jwks_cache and _jwks_cache_time:
        if time.time() - _jwks_cache_time < JWKS_CACHE_TTL:
            return _jwks_cache
    
    # Fetch JWKS from Supabase
    if not SUPABASE_URL:
        raise ValueError("SUPABASE_URL not configured - cannot fetch JWKS")
    jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    try:
        response = httpx.get(jwks_url, timeout=10)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_time = time.time()
        logger.info(f"Fetched JWKS from Supabase: {len(_jwks_cache.get('keys', []))} keys")
        return _jwks_cache
    except Exception as e:
        logger.error(f"Failed to fetch JWKS from {jwks_url}: {e}")
        if _jwks_cache:
            logger.warning("Using cached JWKS despite fetch failure")
            return _jwks_cache
        raise

def get_public_key_from_jwks(kid: str) -> Optional[Any]:
    """
    Get the public key from JWKS for a specific key ID (kid).
    """
    jwks = get_jwks()
    for key in jwks.get('keys', []):
        if key.get('kid') == kid:
            # Convert JWK to cryptography public key for ES256
            if key.get('kty') == 'EC' and key.get('crv') == 'P-256':
                x = base64url_decode(key['x'].encode())
                y = base64url_decode(key['y'].encode())
                public_numbers = ec.EllipticCurvePublicNumbers(
                    int.from_bytes(x, 'big'),
                    int.from_bytes(y, 'big'),
                    ec.SECP256R1()
                )
                return public_numbers.public_key(default_backend())
    return None

# ES256 only - no symmetric key needed

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
        # First, decode header to determine algorithm
        token_alg = None
        token_kid = None
        try:
            parts = token.split('.')
            if len(parts) >= 1:
                header_b64 = parts[0]
                padding = 4 - len(header_b64) % 4
                if padding != 4:
                    header_b64 += '=' * padding
                header_json = base64.urlsafe_b64decode(header_b64)
                header = json.loads(header_json)
                token_alg = header.get('alg', 'unknown')
                token_kid = header.get('kid', None)
        except Exception:
            pass
        
        # Validate using ES256 only (asymmetric keys from JWKS)
        try:
            if not token_kid:
                raise JWTError("Token missing 'kid' (key ID) - required for ES256 validation")
            
            if token_alg != 'ES256':
                raise JWTError(f"Unsupported algorithm: {token_alg}. Only ES256 is supported.")
            
            public_key = get_public_key_from_jwks(token_kid)
            if not public_key:
                raise JWTError(f"Could not find public key for kid: {token_kid}")
            
            user = jwt.decode(
                token,
                public_key,
                algorithms=["ES256"],
                audience="authenticated"
            )
            logger.debug(f"Successfully validated ES256 token with kid: {token_kid}")
            
            # Store token for reuse in dependencies
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
                            token_typ = header.get('typ', 'unknown')
                            
                            # Log at ERROR level to ensure it shows up
                            logger.error(f"=== JWT VALIDATION FAILURE ===")
                            logger.error(f"Error: {error_msg}")
                            logger.error(f"Token algorithm: {token_alg}")
                            logger.error(f"Token type: {token_typ}")
                            logger.error(f"Expected algorithm: ES256")
                            logger.error(f"Path: {request.url.path}")
                            logger.error(f"SUPABASE_URL: {SUPABASE_URL}")
                            
                            if token_alg != 'ES256':
                                logger.error(f"❌ UNSUPPORTED ALGORITHM: Token uses '{token_alg}' but only ES256 is supported!")
                                logger.error(f"Ensure your Supabase project is configured to use ES256 (asymmetric keys).")
                            else:
                                logger.error(f"❌ ES256 VALIDATION FAILED: {error_msg}")
                                logger.error(f"Check that SUPABASE_URL is correct and JWKS endpoint is accessible.")
                            logger.error(f"==============================")
                    except Exception as decode_error:
                        logger.error(f"Could not decode JWT header for debugging: {decode_error}")
                        logger.error(f"JWT validation failed: {error_msg} (path: {request.url.path})")
                # Token is invalid or expired - don't set user
                pass

    request.state.user = user  # Always set it (None if no valid token)
    return await call_next(request)

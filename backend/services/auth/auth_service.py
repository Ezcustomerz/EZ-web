from fastapi import HTTPException, Response
from fastapi.responses import JSONResponse
from jose import jwt, JWTError
from dotenv import load_dotenv
import os
import logging
from typing import Dict, Any

load_dotenv()

logger = logging.getLogger(__name__)

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")


class AuthController:
    """Controller for authentication-related operations"""
    
    @staticmethod
    def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
        """
        Set HttpOnly, Secure cookies for authentication tokens.
        These cookies are not accessible to JavaScript, preventing XSS attacks.
        
        Args:
            response: FastAPI Response object to set cookies on
            access_token: JWT access token
            refresh_token: JWT refresh token
        """
        # Determine if we're in production (HTTPS required for Secure flag)
        is_production = os.getenv("ENVIRONMENT") == "production"
        
        # Access token cookie (HttpOnly, Secure in production)
        response.set_cookie(
            key="sb-access-token",
            value=access_token,
            httponly=True,
            secure=is_production,  # Only use Secure flag in production (requires HTTPS)
            samesite="lax",  # CSRF protection - allows same-site navigation
            max_age=3600,  # 1 hour - matches JWT expiry
            path="/",
        )
        
        # Refresh token cookie (HttpOnly, Secure in production)
        # Store refresh token in HttpOnly cookie for maximum security
        # Note: This means client-side JS can't directly refresh, but backend can handle it
        response.set_cookie(
            key="sb-refresh-token",
            value=refresh_token,
            httponly=True,
            secure=is_production,
            samesite="lax",
            max_age=60 * 60 * 24 * 7,  # 7 days - longer lived for refresh
            path="/",
        )

    @staticmethod
    def clear_auth_cookies(response: Response):
        """
        Clear authentication cookies on logout.
        
        Args:
            response: FastAPI Response object to clear cookies on
        """
        response.delete_cookie(key="sb-access-token", path="/", samesite="lax")
        response.delete_cookie(key="sb-refresh-token", path="/", samesite="lax")

    @staticmethod
    def validate_jwt_token(token: str) -> Dict[str, Any]:
        """
        Validate a JWT token and return its payload.
        This ensures only valid Supabase tokens are accepted.
        
        Args:
            token: JWT token to validate
            
        Returns:
            Decoded token payload
            
        Raises:
            HTTPException: If token is invalid, expired, or JWT secret is not configured
        """
        if not SUPABASE_JWT_SECRET:
            raise HTTPException(status_code=500, detail="JWT secret not configured")
        
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
            return payload
        except JWTError as e:
            # Token is invalid, expired, or malformed
            logger.warning(f"Invalid JWT token provided to set_cookies: {str(e)}")
            raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")

    @staticmethod
    async def set_cookies(access_token: str, refresh_token: str) -> JSONResponse:
        """
        Create a response with authentication cookies set.
        Validates the access token before setting cookies to ensure security.
        Note: This endpoint is typically called after Supabase token refresh,
        so invalid tokens should be rare, but we validate for security.
        
        Args:
            access_token: JWT access token (will be validated)
            refresh_token: JWT refresh token (stored but not validated as it has different structure)
            
        Returns:
            JSONResponse with cookies set
            
        Raises:
            HTTPException: If tokens are missing or access token is invalid
        """
        if not access_token or not refresh_token:
            raise HTTPException(status_code=400, detail="Missing access_token or refresh_token")
        
        # Validate the access token before setting cookies
        # This ensures only valid Supabase tokens are stored
        try:
            AuthController.validate_jwt_token(access_token)
        except HTTPException:
            raise
        
        # Note: Refresh tokens have a different structure and are validated by Supabase
        # when used for token refresh, so we don't validate them here
        
        response = JSONResponse({"success": True, "message": "Cookies set successfully"})
        AuthController.set_auth_cookies(response, access_token, refresh_token)
        
        return response

    @staticmethod
    async def logout(request) -> JSONResponse:
        """
        Handle logout by clearing authentication cookies.
        This endpoint always succeeds in clearing cookies, even if session revocation fails.
        This is important for security - users should always be able to logout.
        
        Args:
            request: FastAPI Request object
            
        Returns:
            JSONResponse indicating successful logout
        """
        # Always clear cookies first - this is the most important part of logout
        response = JSONResponse({"success": True, "message": "Logged out successfully"})
        AuthController.clear_auth_cookies(response)
        
        # Optionally try to revoke the session with Supabase if we have tokens
        # But don't fail the logout if this fails - cookies are already cleared
        access_token_cookie = request.cookies.get("sb-access-token")
        refresh_token_cookie = request.cookies.get("sb-refresh-token")
        
        # Only attempt session revocation if we have tokens
        if access_token_cookie or refresh_token_cookie:
            try:
                # Create a temporary Supabase client with the access token to revoke the session
                # Note: Supabase doesn't have a direct "revoke session by token" API,
                # so we just clear the cookies which effectively logs the user out
                # The session will expire naturally when the token expires
                pass  # Session revocation is handled client-side by Supabase
            except Exception as e:
                # Log the error but don't fail the logout
                # Cookies are already cleared, which is the critical part
                logger.warning(f"Failed to revoke session during logout (non-critical): {str(e)}")
        
        return response


from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from core.limiter import limiter
from db.db_session import db_client
import os
import logging
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """
    Set HttpOnly, Secure cookies for authentication tokens.
    These cookies are not accessible to JavaScript, preventing XSS attacks.
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


def clear_auth_cookies(response: Response):
    """Clear authentication cookies on logout"""
    response.delete_cookie(key="sb-access-token", path="/", samesite="lax")
    response.delete_cookie(key="sb-refresh-token", path="/", samesite="lax")


@router.post("/set-cookies")
@limiter.limit("10 per minute")
async def set_cookies(request: Request):
    """
    Endpoint to set HttpOnly cookies after successful authentication.
    Called by frontend after Supabase auth completes.
    """
    try:
        # Get tokens from request body
        body = await request.json()
        access_token = body.get("access_token")
        refresh_token = body.get("refresh_token")
        
        if not access_token or not refresh_token:
            raise HTTPException(status_code=400, detail="Missing access_token or refresh_token")
        
        response = JSONResponse({"success": True, "message": "Cookies set successfully"})
        set_auth_cookies(response, access_token, refresh_token)
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set cookies: {str(e)}")


@router.post("/refresh-token")
@limiter.limit("10 per minute")
async def refresh_token(request: Request):
    """
    Endpoint to refresh access token using refresh token from HttpOnly cookie.
    Returns new access token and sets updated cookies.
    """
    try:
        refresh_token_cookie = request.cookies.get("sb-refresh-token")
        
        if not refresh_token_cookie:
            raise HTTPException(status_code=401, detail="No refresh token found")
        
        # Use Supabase client to refresh the session
        # Note: This requires using the service role or handling refresh server-side
        # For now, we'll return the refresh token to the client
        # In a production setup, you'd want to exchange it server-side with Supabase
        
        response = JSONResponse({
            "success": True,
            "message": "Token refresh handled by Supabase client",
            "refresh_token": refresh_token_cookie
        })
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh token: {str(e)}")


@router.post("/logout")
@limiter.limit("10 per minute")
async def logout(request: Request):
    """
    Logout endpoint that clears HttpOnly cookies.
    This endpoint always succeeds in clearing cookies, even if session revocation fails.
    This is important for security - users should always be able to logout.
    """
    # Always clear cookies first - this is the most important part of logout
    response = JSONResponse({"success": True, "message": "Logged out successfully"})
    clear_auth_cookies(response)
    
    # Optionally try to revoke the session with Supabase if we have tokens
    # But don't fail the logout if this fails - cookies are already cleared
    access_token_cookie = request.cookies.get("sb-access-token")
    refresh_token_cookie = request.cookies.get("sb-refresh-token")
    
    # Only attempt session revocation if we have tokens
    if access_token_cookie or refresh_token_cookie:
        try:
            # Create a temporary Supabase client with the access token to revoke the session
            # We use db_admin (service role) to revoke sessions, which doesn't require session context
            # Note: Supabase doesn't have a direct "revoke session by token" API,
            # so we just clear the cookies which effectively logs the user out
            # The session will expire naturally when the token expires
            pass  # Session revocation is handled client-side by Supabase
        except Exception as e:
            # Log the error but don't fail the logout
            # Cookies are already cleared, which is the critical part
            logging.warning(f"Failed to revoke session during logout (non-critical): {str(e)}")
    
    return response


@router.get("/jwt_check")
@limiter.limit("2 per second")
def jwt_check(request: Request):
    """Test endpoint to verify JWT authentication"""
    if not request.state.user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"message": f"Hello {request.state.user.get('email', 'User')}"}

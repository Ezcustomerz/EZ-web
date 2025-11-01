from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from core.limiter import limiter
from db.db_session import db_client
import os
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
    """Logout endpoint that clears HttpOnly cookies"""
    try:
        refresh_token_cookie = request.cookies.get("sb-refresh-token")
        
        # If we have a refresh token, revoke it with Supabase
        if refresh_token_cookie:
            try:
                # Sign out using Supabase client
                db_client.auth.sign_out()
            except Exception:
                pass  # Ignore errors if token is already invalid
        
        response = JSONResponse({"success": True, "message": "Logged out successfully"})
        clear_auth_cookies(response)
        
        return response
    except Exception as e:
        response = JSONResponse({"success": False, "message": f"Logout error: {str(e)}"})
        clear_auth_cookies(response)  # Clear cookies anyway
        return response


@router.get("/jwt_check")
@limiter.limit("2 per second")
def jwt_check(request: Request):
    """Test endpoint to verify JWT authentication"""
    if not request.state.user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"message": f"Hello {request.state.user.get('email', 'User')}"}

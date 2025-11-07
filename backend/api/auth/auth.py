from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from services.auth.auth_service import AuthController
from core.limiter import limiter

router = APIRouter()


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
        
        return await AuthController.set_cookies(access_token, refresh_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set cookies: {str(e)}")


@router.post("/logout")
@limiter.limit("10 per minute")
async def logout(request: Request):
    """
    Logout endpoint that clears HttpOnly cookies.
    This endpoint always succeeds in clearing cookies, even if session revocation fails.
    This is important for security - users should always be able to logout.
    """
    try:
        return await AuthController.logout(request)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to logout: {str(e)}")


@router.get("/jwt_check")
@limiter.limit("2 per second")
def jwt_check(request: Request):
    """Test endpoint to verify JWT authentication"""
    if not request.state.user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"message": f"Hello {request.state.user.get('email', 'User')}"}


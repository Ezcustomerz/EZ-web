"""Creative orders router for booking endpoints"""
from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Dict, Any
import logging
from core.limiter import limiter
from core.verify import require_auth
from db.db_session import get_authenticated_client_dep
from supabase import Client
from services.booking.order_service import OrderService
from schemas.booking import OrdersListResponse, CalendarSessionsResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/creative", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_creative_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get all orders for the current creative user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with creative_status = 'pending_approval' (and other statuses)
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await OrderService.get_creative_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative orders: {str(e)}")


@router.get("/creative/current", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_creative_current_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get current orders for the current creative user
    Requires authentication - will return 401 if not authenticated.
    Returns orders excluding 'complete', 'rejected', and 'canceled' statuses
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await OrderService.get_creative_current_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative current orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative current orders: {str(e)}")


@router.get("/creative/past", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_creative_past_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get past orders for the current creative user
    Requires authentication - will return 401 if not authenticated.
    Returns only orders with creative_status = 'complete', 'rejected', or 'canceled'
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await OrderService.get_creative_past_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative past orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch creative past orders: {str(e)}")


@router.get("/creative/calendar", response_model=CalendarSessionsResponse)
@limiter.limit("20 per minute")
async def get_creative_calendar_sessions(
    request: Request,
    year: int,
    month: int,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get calendar sessions for the current creative user for a specific month
    Requires authentication - will return 401 if not authenticated.
    Returns bookings with calendar-specific format
    Status mapping:
    - pending_approval -> pending
    - in_progress, awaiting_payment -> confirmed
    - rejected -> cancelled
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await OrderService.get_creative_calendar_sessions(user_id, year, month, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative calendar sessions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch calendar sessions: {str(e)}")


@router.get("/creative/calendar/week", response_model=CalendarSessionsResponse)
@limiter.limit("20 per minute")
async def get_creative_calendar_sessions_week(
    request: Request,
    start_date: str,
    end_date: str,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get calendar sessions for the current creative user for a specific week (date range)
    Requires authentication - will return 401 if not authenticated.
    Returns bookings with calendar-specific format
    Status mapping:
    - pending_approval -> pending
    - in_progress, awaiting_payment -> confirmed
    - rejected -> cancelled
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await OrderService.get_creative_calendar_sessions_week(user_id, start_date, end_date, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching creative calendar sessions for week: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch calendar sessions: {str(e)}")


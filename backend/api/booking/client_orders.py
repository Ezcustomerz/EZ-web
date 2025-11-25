"""Client orders router for booking endpoints"""
from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Dict, Any
import logging
from core.limiter import limiter
from core.verify import require_auth
from db.db_session import get_authenticated_client_dep
from supabase import Client
from services.booking.order_service import OrderService
from schemas.booking import OrdersListResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/client", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_client_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get all orders for the current client user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with client_status = 'placed' (and other statuses)
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await OrderService.get_client_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client orders: {str(e)}")


@router.get("/client/in-progress", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_client_in_progress_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get in-progress orders for the current client user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with client_status = 'in_progress'
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await OrderService.get_client_in_progress_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client in-progress orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client in-progress orders: {str(e)}")


@router.get("/client/action-needed", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_client_action_needed_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get action-needed orders for the current client user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with statuses: payment_required, locked, download
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await OrderService.get_client_action_needed_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client action-needed orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client action-needed orders: {str(e)}")


@router.get("/client/history", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_client_history_orders(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get history orders for the current client user
    Requires authentication - will return 401 if not authenticated.
    Returns orders with statuses: completed, canceled
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await OrderService.get_client_history_orders(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client history orders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client history orders: {str(e)}")


@router.get("/client/upcoming", response_model=OrdersListResponse)
@limiter.limit("20 per minute")
async def get_client_upcoming_bookings(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """
    Get upcoming scheduled bookings for the current client user
    Requires authentication - will return 401 if not authenticated.
    Returns scheduled bookings (with booking_date and start_time) that are upcoming (booking_date >= today)
    and not cancelled, sorted by booking_date and start_time ascending.
    """
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication failed: User ID not found")
        
        return await OrderService.get_client_upcoming_bookings(user_id, client)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client upcoming bookings: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch client upcoming bookings: {str(e)}")


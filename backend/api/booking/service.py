from fastapi import APIRouter, HTTPException, Query, Request, Depends
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from core.verify import get_current_user_optional
from core.safe_errors import log_exception_if_dev
from db.db_session import get_authenticated_client_dep
from services.booking.booking_service import BookingService
from supabase import Client

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/service/{service_id}/calendar-settings")
async def get_calendar_settings(
    service_id: str,
    request: Request,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get calendar settings for a service. Works without auth for invite page (public services only via RLS)."""
    try:
        settings = BookingService.get_calendar_settings(service_id, client)
        
        if not settings:
            raise HTTPException(status_code=404, detail="Calendar settings not found")
        
        return {"success": True, "data": settings}
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error fetching calendar settings", e)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/service/{service_id}/weekly-schedule")
async def get_weekly_schedule(
    service_id: str,
    request: Request,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get weekly schedule for a service. Works without auth for invite page (public services only via RLS)."""
    try:
        # First get calendar settings to get the calendar_setting_id
        calendar_settings = BookingService.get_calendar_settings(service_id, client)
        if not calendar_settings:
            raise HTTPException(status_code=404, detail="Calendar settings not found")
        
        schedule = BookingService.get_weekly_schedule(calendar_settings["id"], client)
        
        return {"success": True, "data": schedule}
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error fetching weekly schedule", e)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/service/{service_id}/time-slots")
async def get_time_slots(
    service_id: str,
    request: Request,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get all time slots for a service. Works without auth for invite page (public services only via RLS)."""
    try:
        # First get calendar settings to get the calendar_setting_id
        calendar_settings = BookingService.get_calendar_settings(service_id, client)
        if not calendar_settings:
            raise HTTPException(status_code=404, detail="Calendar settings not found")
        
        # Get weekly schedule
        weekly_schedule = BookingService.get_weekly_schedule(calendar_settings["id"], client)
        
        # Get time slots for each day
        all_time_slots = []
        for day in weekly_schedule:
            if day["is_enabled"]:
                day_slots = BookingService.get_time_slots(day["id"], client)
                all_time_slots.extend(day_slots)
        
        return {"success": True, "data": all_time_slots}
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error fetching time slots", e)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/service/{service_id}/available-dates")
async def get_available_dates(
    service_id: str,
    request: Request,
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format"),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get available booking dates for a service. Works without auth for invite page (public services only via RLS)."""
    try:
        # Parse dates
        start = None
        end = None
        
        if start_date:
            try:
                start = datetime.strptime(start_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use YYYY-MM-DD")
        
        if end_date:
            try:
                end = datetime.strptime(end_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use YYYY-MM-DD")
        
        available_dates = BookingService.get_available_dates(service_id, client, start, end)
        
        return {"success": True, "data": available_dates}
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error fetching available dates", e)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/service/{service_id}/available-time-slots")
async def get_available_time_slots(
    service_id: str,
    request: Request,
    booking_date: str = Query(..., description="Booking date in YYYY-MM-DD format"),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get available time slots for a specific date. Works without auth for invite page (public services only via RLS)."""
    try:
        # Parse date
        try:
            booking_date_obj = datetime.strptime(booking_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid booking_date format. Use YYYY-MM-DD")
        
        time_slots = BookingService.get_available_time_slots(service_id, booking_date_obj, client)
        
        return {"success": True, "data": time_slots}
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error fetching available time slots", e)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/service/{service_id}/booking-data")
async def get_service_booking_data(
    service_id: str,
    request: Request,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get complete booking data for a service. Works without auth for invite page (public services only via RLS)."""
    try:
        booking_data = BookingService.get_service_booking_data(service_id, client)
        
        if "error" in booking_data:
            raise HTTPException(status_code=404, detail=booking_data["error"])
        
        return {"success": True, "data": booking_data}
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Error fetching service booking data", e)
        raise HTTPException(status_code=500, detail="Internal server error")


"""Creative analytics endpoints"""
from fastapi import APIRouter, Depends, Query
from core.verify import get_current_user
from db.db_session import get_authenticated_client_dep
from supabase import Client
from schemas.creative import AnalyticsMetricsResponse
from schemas.analytics import IncomeOverTimeResponse, ServiceBreakdownResponse, ClientLeaderboardResponse
from datetime import datetime, timedelta
from typing import Literal

router = APIRouter(prefix="/analytics", tags=["creative-analytics"])


@router.get("/metrics", response_model=AnalyticsMetricsResponse)
async def get_analytics_metrics(
    db: Client = Depends(get_authenticated_client_dep),
    current_user: dict = Depends(get_current_user)
):
    """
    Get analytics metrics for creative dashboard:
    - Total earnings (revenue from all completed/paid bookings)
    - Subscription plan
    - Unpaid pending (awaiting payment or partial payments)
    - Completed projects
    """
    user_id = current_user.get("sub")
    
    # Get creative details including subscription tier
    creative_result = db.table("creatives")\
        .select("subscription_tier_id, subscription_tiers(name)")\
        .eq("user_id", user_id)\
        .single()\
        .execute()
    
    if not creative_result.data:
        return {
            "total_earnings": 0,
            "plan": "Free",
            "unpaid_pending": 0,
            "completed_projects": 0
        }
    
    plan_name = creative_result.data.get("subscription_tiers", {}).get("name", "plain")
    # Capitalize first letter for display
    plan_display = plan_name.capitalize() if plan_name else "Plain"
    
    # Get all bookings for this creative
    bookings_result = db.table("bookings")\
        .select("price, amount_paid, payment_status, creative_status")\
        .eq("creative_user_id", user_id)\
        .execute()
    
    bookings = bookings_result.data if bookings_result.data else []
    
    # Calculate metrics
    total_earnings = 0
    unpaid_pending = 0
    completed_projects = 0
    
    for booking in bookings:
        price = float(booking.get("price", 0))
        amount_paid = float(booking.get("amount_paid", 0))
        payment_status = booking.get("payment_status")
        creative_status = booking.get("creative_status")
        
        # Count completed projects
        if creative_status == "completed":
            completed_projects += 1
            # Add to total earnings if fully paid
            if payment_status == "fully_paid":
                total_earnings += amount_paid
        
        # Calculate unpaid pending
        # Include bookings that are:
        # 1. Awaiting payment (approved but not paid)
        # 2. Partially paid (split payment with remaining balance)
        # 3. In progress with payment later option
        if creative_status in ["awaiting_payment", "in_progress"]:
            remaining_balance = price - amount_paid
            if remaining_balance > 0:
                unpaid_pending += remaining_balance
    
    return {
        "total_earnings": round(total_earnings, 2),
        "plan": plan_display,
        "unpaid_pending": round(unpaid_pending, 2),
        "completed_projects": completed_projects
    }


@router.get("/income-over-time", response_model=IncomeOverTimeResponse)
async def get_income_over_time(
    time_period: Literal["week", "month", "year"] = Query(...),
    period_offset: int = Query(0, ge=-100),  # 0 = current, -1 = previous, etc.
    db: Client = Depends(get_authenticated_client_dep),
    current_user: dict = Depends(get_current_user)
):
    """
    Get income data over time (week, month, or year) for a specific period.
    Only returns periods where the account existed and had activity.
    """
    user_id = current_user.get("sub")
    
    # Get creative's account creation date
    creative_result = db.table("creatives")\
        .select("created_at")\
        .eq("user_id", user_id)\
        .single()\
        .execute()
    
    if not creative_result.data:
        return {
            "data": [],
            "total": 0,
            "available_periods": [0],
            "account_created_at": datetime.now().isoformat()
        }
    
    account_created_at = datetime.fromisoformat(creative_result.data["created_at"].replace("Z", "+00:00"))
    now = datetime.now(account_created_at.tzinfo)
    
    # Calculate period boundaries
    if time_period == "week":
        # Calculate week start (Monday)
        current_week_start = now - timedelta(days=now.weekday())
        period_start = current_week_start + timedelta(weeks=period_offset)
        period_end = period_start + timedelta(days=7)
        
        # Week hasn't started yet if period_start is in the future
        if period_start > now:
            return {"data": [], "total": 0, "available_periods": [0], "account_created_at": account_created_at.isoformat()}
        
        # Get bookings in this week
        bookings_result = db.table("bookings")\
            .select("order_date, price, amount_paid, payment_status, creative_status")\
            .eq("creative_user_id", user_id)\
            .gte("order_date", period_start.isoformat())\
            .lt("order_date", period_end.isoformat())\
            .eq("payment_status", "fully_paid")\
            .eq("creative_status", "completed")\
            .execute()
        
        # Initialize data for all 7 days
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        data = {day: 0.0 for day in day_names}
        
        # Aggregate income by day
        for booking in (bookings_result.data or []):
            order_date = datetime.fromisoformat(booking["order_date"].replace("Z", "+00:00"))
            day_name = day_names[order_date.weekday()]
            data[day_name] += float(booking["amount_paid"])
        
        # Determine current day index (only for current period)
        current_day_index = now.weekday() if period_offset == 0 else 6
        
        # Build response
        income_data = []
        for i, day in enumerate(day_names):
            # For current period, only show data up to today
            if period_offset == 0 and i > current_day_index:
                income = None
            else:
                income = round(data[day], 2)
            
            income_data.append({
                "name": day,
                "income": income,
                "is_current": (period_offset == 0 and i == current_day_index)
            })
        
    elif time_period == "month":
        # Calculate month start
        if period_offset == 0:
            period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            # Go back |period_offset| months
            month = now.month + period_offset
            year = now.year
            while month < 1:
                month += 12
                year -= 1
            period_start = now.replace(year=year, month=month, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Calculate next month for period_end
        next_month = period_start.month + 1
        next_year = period_start.year
        if next_month > 12:
            next_month = 1
            next_year += 1
        period_end = period_start.replace(year=next_year, month=next_month)
        
        if period_start > now:
            return {"data": [], "total": 0, "available_periods": [0], "account_created_at": account_created_at.isoformat()}
        
        # Get bookings in this month
        bookings_result = db.table("bookings")\
            .select("order_date, price, amount_paid, payment_status, creative_status")\
            .eq("creative_user_id", user_id)\
            .gte("order_date", period_start.isoformat())\
            .lt("order_date", period_end.isoformat())\
            .eq("payment_status", "fully_paid")\
            .eq("creative_status", "completed")\
            .execute()
        
        # Group by week
        week_data = {1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0}
        for booking in (bookings_result.data or []):
            order_date = datetime.fromisoformat(booking["order_date"].replace("Z", "+00:00"))
            week_num = (order_date.day - 1) // 7 + 1
            week_num = min(week_num, 4)  # Cap at week 4
            week_data[week_num] += float(booking["amount_paid"])
        
        # Determine current week
        current_week = (now.day - 1) // 7 + 1 if period_offset == 0 else 4
        current_week = min(current_week, 4)
        
        income_data = []
        for week in range(1, 5):
            if period_offset == 0 and week > current_week:
                income = None
            else:
                income = round(week_data[week], 2)
            
            income_data.append({
                "name": f"Week {week}",
                "income": income,
                "is_current": (period_offset == 0 and week == current_week)
            })
    
    else:  # year
        # Calculate year start
        period_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        period_start = period_start.replace(year=period_start.year + period_offset)
        period_end = period_start.replace(year=period_start.year + 1)
        
        if period_start > now:
            return {"data": [], "total": 0, "available_periods": [0], "account_created_at": account_created_at.isoformat()}
        
        # Get bookings in this year
        bookings_result = db.table("bookings")\
            .select("order_date, price, amount_paid, payment_status, creative_status")\
            .eq("creative_user_id", user_id)\
            .gte("order_date", period_start.isoformat())\
            .lt("order_date", period_end.isoformat())\
            .eq("payment_status", "fully_paid")\
            .eq("creative_status", "completed")\
            .execute()
        
        # Group by month
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        month_data = {month: 0.0 for month in month_names}
        
        for booking in (bookings_result.data or []):
            order_date = datetime.fromisoformat(booking["order_date"].replace("Z", "+00:00"))
            month_name = month_names[order_date.month - 1]
            month_data[month_name] += float(booking["amount_paid"])
        
        # Determine current month
        current_month_index = now.month - 1 if period_offset == 0 else 11
        
        income_data = []
        for i, month in enumerate(month_names):
            if period_offset == 0 and i > current_month_index:
                income = None
            else:
                income = round(month_data[month], 2)
            
            income_data.append({
                "name": month,
                "income": income,
                "is_current": (period_offset == 0 and i == current_month_index)
            })
    
    # Calculate total (excluding null values)
    total = sum(item["income"] for item in income_data if item["income"] is not None)
    
    # Calculate available periods based on account creation date
    available_periods = [0]
    if time_period == "week":
        weeks_since_creation = (now - account_created_at).days // 7
        available_periods = list(range(0, -min(weeks_since_creation, 52), -1))
    elif time_period == "month":
        months_since_creation = (now.year - account_created_at.year) * 12 + (now.month - account_created_at.month)
        available_periods = list(range(0, -min(months_since_creation, 24), -1))
    else:  # year
        years_since_creation = now.year - account_created_at.year
        available_periods = list(range(0, -min(years_since_creation, 10), -1))
    
    return {
        "data": income_data,
        "total": round(total, 2),
        "available_periods": available_periods,
        "account_created_at": account_created_at.isoformat()
    }


@router.get("/service-breakdown", response_model=ServiceBreakdownResponse)
async def get_service_breakdown(
    time_period: Literal["week", "month", "year", "all-time"] = Query(...),
    db: Client = Depends(get_authenticated_client_dep),
    current_user: dict = Depends(get_current_user)
):
    """
    Get revenue breakdown by service for a specific time period.
    Returns the total revenue per service from completed and paid bookings.
    
    Important: This endpoint includes revenue from soft-deleted services (is_active=false)
    to maintain historical accuracy. Services only appear in periods where they
    generated actual revenue. If a service is deleted, it will still show in past
    periods where it had bookings, but won't appear in future periods since no
    new bookings can be made for deleted services.
    """
    user_id = current_user.get("sub")
    
    # Calculate period boundaries
    now = datetime.now()
    
    if time_period == "week":
        # Current week start (Monday)
        period_start = now - timedelta(days=now.weekday())
        period_start = period_start.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_period == "month":
        # Current month start
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif time_period == "year":
        # Current year start
        period_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # all-time
        period_start = datetime(2000, 1, 1)  # Effectively no start limit
    
    # Get all completed and paid bookings with service details
    # Note: We don't filter by is_active to include historical data from deleted services
    bookings_query = db.table("bookings")\
        .select("service_id, amount_paid, creative_services!inner(title, color)")\
        .eq("creative_user_id", user_id)\
        .eq("payment_status", "fully_paid")\
        .eq("creative_status", "completed")
    
    # Only add time filter if not all-time
    if time_period != "all-time":
        bookings_query = bookings_query.gte("order_date", period_start.isoformat())
    
    bookings_result = bookings_query.execute()
    
    bookings = bookings_result.data if bookings_result.data else []
    
    # Aggregate revenue by service
    service_revenue = {}
    service_info = {}
    
    for booking in bookings:
        service_id = booking.get("service_id")
        amount_paid = float(booking.get("amount_paid", 0))
        service_data = booking.get("creative_services")
        
        # Handle case where service might be deleted (shouldn't happen with inner join, but safety check)
        if not service_data:
            continue
            
        if service_id:
            if service_id not in service_revenue:
                service_revenue[service_id] = 0
                service_info[service_id] = {
                    "title": service_data.get("title", "Unknown Service"),
                    "color": service_data.get("color", "#3b82f6")
                }
            
            service_revenue[service_id] += amount_paid
    
    # Build response data
    data = []
    for service_id, revenue in service_revenue.items():
        info = service_info[service_id]
        data.append({
            "name": info["title"],
            "value": round(revenue, 2),
            "color": info["color"],
            "service_id": service_id
        })
    
    # Sort by revenue (highest first)
    data.sort(key=lambda x: x["value"], reverse=True)
    
    # Calculate total
    total = sum(item["value"] for item in data)
    
    return {
        "data": data,
        "total": round(total, 2)
    }


@router.get("/client-leaderboard", response_model=ClientLeaderboardResponse)
async def get_client_leaderboard(
    db: Client = Depends(get_authenticated_client_dep),
    current_user: dict = Depends(get_current_user)
):
    """
    Get top 8 clients ranked by total revenue (amount_paid).
    Returns client name, number of services, total paid, and last payment date.
    Uses updated_at field which is explicitly set to payment timestamp when payment is verified.
    Includes all fully_paid bookings regardless of creative_status to capture recent payments.
    """
    user_id = current_user.get("sub")
    
    # Get all fully paid bookings for this creative
    # Include all fully_paid bookings regardless of creative_status to capture recent payments
    # (e.g., split payments that are fully paid but not yet completed)
    bookings_result = db.table("bookings")\
        .select("id, client_user_id, amount_paid, updated_at, payment_status, creative_status")\
        .eq("creative_user_id", user_id)\
        .eq("payment_status", "fully_paid")\
        .execute()
    
    bookings = bookings_result.data if bookings_result.data else []
    
    if not bookings:
        return {"data": []}
    
    # Note: We now rely on updated_at which is explicitly set to payment timestamp
    # when payment is verified in verify_payment_and_update_booking.
    # This is more reliable and faster than querying Stripe for all sessions.
    
    # Aggregate data by client
    client_data = {}
    
    for booking in bookings:
        booking_id = booking.get("id")
        client_user_id = booking.get("client_user_id")
        amount_paid = float(booking.get("amount_paid", 0))
        
        # Use updated_at which is now explicitly set to payment timestamp when payment is verified
        payment_date = booking.get("updated_at")
        
        if not client_user_id:
            continue
        
        if client_user_id not in client_data:
            client_data[client_user_id] = {
                "total_paid": 0.0,
                "services_amount": 0,
                "last_payment_date": None
            }
        
        client_data[client_user_id]["total_paid"] += amount_paid
        client_data[client_user_id]["services_amount"] += 1
        
        # Track latest payment date
        if payment_date:
            if client_data[client_user_id]["last_payment_date"] is None:
                client_data[client_user_id]["last_payment_date"] = payment_date
            else:
                # Compare dates and keep the latest
                if payment_date > client_data[client_user_id]["last_payment_date"]:
                    client_data[client_user_id]["last_payment_date"] = payment_date
    
    # Get client display names
    client_user_ids = list(client_data.keys())
    clients_result = db.table("clients")\
        .select("user_id, display_name")\
        .in_("user_id", client_user_ids)\
        .execute()
    
    clients_map = {c["user_id"]: c.get("display_name", "Unknown Client") for c in (clients_result.data or [])}
    
    # Build response data
    leaderboard_data = []
    for client_user_id, data in client_data.items():
        leaderboard_data.append({
            "id": client_user_id,
            "name": clients_map.get(client_user_id, "Unknown Client"),
            "services_amount": data["services_amount"],
            "total_paid": round(data["total_paid"], 2),
            "last_payment_date": data["last_payment_date"] or ""
        })
    
    # Sort by total_paid (descending) and take top 8
    leaderboard_data.sort(key=lambda x: x["total_paid"], reverse=True)
    leaderboard_data = leaderboard_data[:8]
    
    return {"data": leaderboard_data}

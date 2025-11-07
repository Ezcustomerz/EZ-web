from fastapi import APIRouter
from .service import router as service_router
from .bookings import router as bookings_router

# Main router for booking endpoints
router = APIRouter(
    prefix="/api/bookings",
    tags=["bookings"],
)

# Service router with separate prefix to match frontend expectations
service_main_router = APIRouter(
    prefix="/api/booking",
    tags=["booking-service"],
)

# Include service router with its own prefix
service_main_router.include_router(service_router)

# Include bookings router in main router
router.include_router(bookings_router)


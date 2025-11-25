from fastapi import APIRouter
from .service import router as service_router
from .client_orders import router as client_orders_router
from .creative_orders import router as creative_orders_router
from .booking_actions import router as booking_actions_router
from .deliverables import router as deliverables_router
from .invoices import router as invoices_router

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

# Include all booking routers in main router
router.include_router(client_orders_router)
router.include_router(creative_orders_router)
router.include_router(booking_actions_router)
router.include_router(deliverables_router)
router.include_router(invoices_router)


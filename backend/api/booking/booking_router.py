from fastapi import APIRouter
from .service import router as service_router

router = APIRouter(
    prefix="/api/booking",
    tags=["booking"],
)

router.include_router(service_router)


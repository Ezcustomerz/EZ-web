from fastapi import APIRouter
from .setup import router as setup_router
from .client import router as client_router

router = APIRouter(
    prefix="/client",
    tags=["client"],
)

router.include_router(setup_router)
router.include_router(client_router)
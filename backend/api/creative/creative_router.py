from fastapi import APIRouter
from .setup import router as setup_router
from .creative import router as creative_router

router = APIRouter(
    prefix="/creative",
    tags=["creative"],
)

router.include_router(setup_router)
router.include_router(creative_router)

from fastapi import APIRouter
from .onboarding_router import router as onboarding_router

router = APIRouter(
    prefix="/onboarding",
    tags=["onboarding"],
)

router.include_router(onboarding_router)

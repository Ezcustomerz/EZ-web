from fastapi import APIRouter
from .stripe import router as stripe_router

router = APIRouter()

router.include_router(stripe_router)



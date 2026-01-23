from fastapi import APIRouter
from .subscription_router import router as subscription_router

router = APIRouter()

router.include_router(subscription_router)

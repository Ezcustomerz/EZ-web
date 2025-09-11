from fastapi import APIRouter
from .setup import router as setup_router
from .user import router as user_router

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

router.include_router(setup_router)
router.include_router(user_router)


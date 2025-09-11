from fastapi import APIRouter
from .setup import router as setup_router
from .advocate import router as advocate_router

router = APIRouter(
    prefix="/advocate",
    tags=["advocate"],
)

router.include_router(setup_router)
router.include_router(advocate_router)



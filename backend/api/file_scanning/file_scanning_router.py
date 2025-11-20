from fastapi import APIRouter
from .file_scanning import router as file_scanning_router

router = APIRouter(
    prefix="/file-scanning",
    tags=["file-scanning"],
)

router.include_router(file_scanning_router)


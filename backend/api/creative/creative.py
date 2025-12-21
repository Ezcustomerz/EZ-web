"""Main creative router that includes all sub-routers"""
from fastapi import APIRouter
from .profile import router as profile_router
from .clients import router as clients_router
from .services import router as services_router
from .bundles import router as bundles_router
from .role import router as role_router
from .analytics import router as analytics_router

router = APIRouter()

# Include all sub-routers
router.include_router(profile_router)
router.include_router(clients_router)
router.include_router(services_router)
router.include_router(bundles_router)
router.include_router(role_router)
router.include_router(analytics_router)

from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from services.onboarding.onboarding_service import OnboardingService
from schemas.onboarding import (
    OnboardingStatus, 
    UpdateProgressRequest, 
    SkipSectionRequest,
    CompleteMiniTourRequest,
    RestartMiniTourRequest
)
from core.limiter import limiter
from core.safe_errors import log_exception_if_dev
from core.verify import require_auth
from db.db_session import get_authenticated_client_dep
from supabase import Client
from typing import Dict, Any
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/status", response_model=OnboardingStatus)
@limiter.limit("30 per minute")
async def get_onboarding_status(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Get current onboarding status from JSONB column"""
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")
        
        # Get status from service
        status = await OnboardingService.get_onboarding_status(user_id, client)
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to get onboarding status", e)
        raise HTTPException(status_code=500, detail="Failed to get onboarding status")


@router.post("/main-tour/progress", response_model=OnboardingStatus)
@limiter.limit("30 per minute")
async def update_main_tour_progress(
    request: Request,
    body: UpdateProgressRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Update progress in main onboarding tour"""
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")
        
        status = await OnboardingService.update_main_tour_progress(user_id, body.step, client)
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to update progress", e)
        raise HTTPException(status_code=500, detail="Failed to update progress")


@router.post("/main-tour/complete", response_model=OnboardingStatus)
@limiter.limit("30 per minute")
async def complete_main_tour(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Mark main tour as completed"""
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")
        
        status = await OnboardingService.complete_main_tour(user_id, client)
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to complete tour", e)
        raise HTTPException(status_code=500, detail="Failed to complete tour")


@router.post("/main-tour/skip-section", response_model=OnboardingStatus)
@limiter.limit("30 per minute")
async def skip_section(
    request: Request,
    body: SkipSectionRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Skip a section of the main tour"""
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")
        
        status = await OnboardingService.skip_section(user_id, body.section, client)
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to skip section", e)
        raise HTTPException(status_code=500, detail="Failed to skip section")


@router.post("/main-tour/restart", response_model=OnboardingStatus)
@limiter.limit("10 per minute")
async def restart_main_tour(
    request: Request,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Restart the main tour from beginning"""
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")
        
        status = await OnboardingService.restart_main_tour(user_id, client)
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to restart tour", e)
        raise HTTPException(status_code=500, detail="Failed to restart tour")


@router.post("/mini-tour/complete", response_model=OnboardingStatus)
@limiter.limit("30 per minute")
async def complete_mini_tour(
    request: Request,
    body: CompleteMiniTourRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Mark a mini-tour as completed"""
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")
        
        status = await OnboardingService.complete_mini_tour(user_id, body.tour_id, client)
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to complete mini-tour", e)
        raise HTTPException(status_code=500, detail="Failed to complete mini-tour")


@router.post("/mini-tour/restart", response_model=OnboardingStatus)
@limiter.limit("10 per minute")
async def restart_mini_tour(
    request: Request,
    body: RestartMiniTourRequest,
    current_user: Dict[str, Any] = Depends(require_auth),
    client: Client = Depends(get_authenticated_client_dep)
):
    """Restart a specific mini-tour"""
    try:
        user_id = current_user.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")
        
        status = await OnboardingService.restart_mini_tour(user_id, body.tour_id, client)
        return status
        
    except HTTPException:
        raise
    except Exception as e:
        log_exception_if_dev(logger, "Failed to restart mini-tour", e)
        raise HTTPException(status_code=500, detail="Failed to restart mini-tour")

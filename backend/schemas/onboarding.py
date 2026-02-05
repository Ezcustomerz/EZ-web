from pydantic import BaseModel, Field
from typing import Optional, Dict, List


class OnboardingStatus(BaseModel):
    """Response model for onboarding status (stored in profile_highlight_values JSONB)"""
    completed: bool = False
    current_step: int = 0
    skipped_sections: List[str] = Field(default_factory=list)
    last_seen_at: Optional[str] = None
    version: str = "1.0"
    mini_tours: Dict[str, bool] = Field(default_factory=dict)


class UpdateProgressRequest(BaseModel):
    """Request model for updating main tour progress"""
    step: int = Field(..., ge=0, le=7, description="Current step (0-7)")


class SkipSectionRequest(BaseModel):
    """Request model for skipping a section"""
    section: str = Field(..., description="Section: 'intro', 'bookings', 'portfolio', 'settings'")


class CompleteMiniTourRequest(BaseModel):
    """Request model for completing a mini-tour"""
    tour_id: str = Field(..., description="Tour ID: 'dashboard', 'activity', 'clients', 'public'")


class RestartMiniTourRequest(BaseModel):
    """Request model for restarting a mini-tour"""
    tour_id: str = Field(..., description="Tour ID to restart")

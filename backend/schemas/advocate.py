from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AdvocateSetupResponse(BaseModel):
    success: bool
    message: str

class AdvocateProfile(BaseModel):
    user_id: str
    display_name: Optional[str]
    profile_banner_url: Optional[str]
    profile_source: str
    fp_affiliate_id: Optional[str]
    fp_referral_code: Optional[str]
    fp_referral_link: Optional[str]
    last_payout_at: Optional[datetime]
    last_synced_at: Optional[datetime]
    tier: str
    active_referrals: int
    currency: str
    total_earned: float
    earned_this_month: float
    total_paid_out: float
    pending_payout: float
    sync_source: str
    created_at: datetime
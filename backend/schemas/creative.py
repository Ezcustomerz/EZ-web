from pydantic import BaseModel
from typing import Optional

class CreativeSetupRequest(BaseModel):
    display_name: str
    title: str
    custom_title: Optional[str] = None
    primary_contact: Optional[str] = None
    secondary_contact: Optional[str] = None
    bio: Optional[str] = None
    subscription_tier: str = 'basic'

class CreativeSetupResponse(BaseModel):
    success: bool
    message: str
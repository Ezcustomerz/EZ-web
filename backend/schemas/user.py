from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserProfile(BaseModel):
    user_id: str
    name: str
    email: Optional[str]
    profile_picture_url: Optional[str]
    avatar_source: str
    roles: List[str]
    first_login: bool
    last_login_at: Optional[datetime]
    created_at: datetime

class UpdateRolesRequest(BaseModel):
    selected_roles: List[str]

class UpdateRolesResponse(BaseModel):
    success: bool
    message: str
    user_profile: Optional[UserProfile] = None

class SetupStatusResponse(BaseModel):
    incomplete_setups: List[str]

class BatchSetupRequest(BaseModel):
    creative_data: Optional[dict] = None
    client_data: Optional[dict] = None
    advocate_data: Optional[dict] = None

class BatchSetupResponse(BaseModel):
    success: bool
    message: str
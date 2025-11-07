from pydantic import BaseModel
from typing import Optional, Dict, Any


class GenerateInviteResponse(BaseModel):
    success: bool
    invite_link: str
    expires_at: str
    message: str


class ValidateInviteResponse(BaseModel):
    success: bool
    valid: bool
    creative: Optional[Dict[str, Any]] = None
    expires_at: Optional[str] = None
    user: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


class AcceptInviteResponse(BaseModel):
    success: bool
    message: str
    relationship_id: Optional[str] = None
    relationship_exists: Optional[bool] = None
    needs_client_role: Optional[bool] = None
    creative_user_id: Optional[str] = None


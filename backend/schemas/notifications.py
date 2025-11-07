from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class NotificationResponse(BaseModel):
    id: str
    recipient_user_id: str
    notification_type: str
    title: str
    message: str
    is_read: bool
    related_user_id: Optional[str] = None
    related_entity_id: Optional[str] = None
    related_entity_type: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: str
    updated_at: str


class UnreadCountResponse(BaseModel):
    count: int


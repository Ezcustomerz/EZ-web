from pydantic import BaseModel
from typing import Optional

class ClientSetupRequest(BaseModel):
    display_name: str
    title: str
    custom_title: Optional[str] = None
    email: str

class ClientSetupResponse(BaseModel):
    success: bool
    message: str
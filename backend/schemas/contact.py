from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class ContactFormRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Sender name")
    email: EmailStr = Field(..., description="Sender email address")
    message: str = Field(..., min_length=10, max_length=2000, description="Contact message")


class ContactFormResponse(BaseModel):
    success: bool
    message: str
    error: Optional[str] = None

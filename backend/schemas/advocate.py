from pydantic import BaseModel

class AdvocateSetupResponse(BaseModel):
    success: bool
    message: str
from pydantic import BaseModel

class PublicTokenRequest(BaseModel):
    public_token: str
    
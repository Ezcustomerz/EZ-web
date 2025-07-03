from fastapi import Request
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

    
async def jwt_auth_middleware(request: Request, call_next):
    auth = request.headers.get("Authorization")
    user = None

    if auth and auth.startswith("Bearer "):
        token = auth.split(" ")[1]
        try:
            user = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        except JWTError:
            return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

    request.state.user = user  # Always set it
    return await call_next(request)

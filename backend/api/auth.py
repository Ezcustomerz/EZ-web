from fastapi import APIRouter, Request
from core.limiter import limiter

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.get("/jwt_check")
@limiter.limit("2 per second")
def jwt_check(request: Request):
    return {"message": f"Hello {request.state.user['email']}"}

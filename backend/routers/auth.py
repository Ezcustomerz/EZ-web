from fastapi import APIRouter, Request

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.get("/jwt_check")
def jwt_check(request: Request):
    return {"message": f"Hello {request.state.user['email']}"}

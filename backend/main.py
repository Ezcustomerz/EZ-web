from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from utils.limiter import limiter
from routers import auth
from utils.verify import jwt_auth_middleware

app = FastAPI()

app.middleware("http")(jwt_auth_middleware)
app.add_middleware(SlowAPIMiddleware)
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/")
async def read_root():
    return {"message" :"HELLO WORLD"}

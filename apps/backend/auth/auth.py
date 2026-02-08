from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, EmailStr
from auth import get_password_hash, verify_password, create_access_token

router = APIRouter()

class SignupPayload(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup", status_code=201)
async def signup(request: Request, payload: SignupPayload):
    pool = request.app.state.pool
    existing = await pool.fetchrow("SELECT id FROM users WHERE email = $1", payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = get_password_hash(payload.password)
    row = await pool.fetchrow(
        "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name, created_at",
        payload.email, payload.name, hashed
    )
    return {"user": dict(row)}

@router.post("/token")
async def login(request: Request, payload: LoginPayload):
    pool = request.app.state.pool
    row = await pool.fetchrow("SELECT id, password_hash FROM users WHERE email = $1", payload.email)
    if not row or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(row["id"])
    return {"access_token": token, "token_type": "bearer"}
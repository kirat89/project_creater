from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext

router = APIRouter()

# Security setup
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    """Create JWT access token"""
    expire = datetime.utcnow() + timedelta(
        minutes=(expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


class SignupPayload(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]


@router.post("/signup", status_code=201)
async def signup(request: Request, payload: SignupPayload):
    """Register a new user"""
    pool = request.app.state.pool
    
    try:
        # Check if user already exists
        existing = await pool.fetchrow(
            "SELECT id FROM users WHERE email = $1", payload.email
        )
        if existing:
            raise HTTPException(
                status_code=400, detail="Email already registered"
            )
        
        hashed = get_password_hash(payload.password)
        row = await pool.fetchrow(
            """INSERT INTO users (email, name, password_hash) 
               VALUES ($1, $2, $3) 
               RETURNING id, email, name, created_at""",
            payload.email,
            payload.name,
            hashed,
        )
        
        return {"user": dict(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/login")
async def login(request: Request, payload: LoginPayload):
    """Login user and return access token"""
    pool = request.app.state.pool
    
    try:
        row = await pool.fetchrow(
            "SELECT id, password_hash FROM users WHERE email = $1",
            payload.email,
        )
        
        if not row or not verify_password(payload.password, row["password_hash"]):
            raise HTTPException(
                status_code=401, detail="Invalid email or password"
            )
        
        token = create_access_token(row["id"])
        return {"access_token": token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/token")
async def get_token(request: Request, payload: LoginPayload):
    """OAuth-style token endpoint"""
    return await login(request, payload)


@router.get("/me")
async def get_current_user(request: Request):
    """Get current user from authorization header"""
    auth = request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing auth token")
    
    token = auth.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    pool = request.app.state.pool
    row = await pool.fetchrow(
        "SELECT id, email, name, created_at FROM users WHERE id = $1", user_id
    )
    
    if not row:
        raise HTTPException(status_code=401, detail="User not found")
    
    return {"user": dict(row)}


@router.post("/logout")
async def logout(request: Request):
    """Logout user (client-side token deletion)"""
    return {"message": "Logged out successfully"}

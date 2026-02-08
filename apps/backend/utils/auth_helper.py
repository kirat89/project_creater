import os
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request

SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    expire = datetime.utcnow() + timedelta(minutes=(expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth token")
    token = auth.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    pool = request.app.state.pool
    row = await pool.fetchrow("SELECT id, email, name, created_at FROM users WHERE id = $1", user_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return dict(row)
from datetime import datetime, timedelta
import os
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from auth import queries
from utils.db_errors import rethrow_db_error
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-me-in-production")
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
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials") from exc


class SignupPayload(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup", status_code=201)
async def signup(request: Request, payload: SignupPayload):
    try:
        pool = request.app.state.pool
        existing = await pool.fetchrow(queries.GET_USER_BY_EMAIL, payload.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed = get_password_hash(payload.password)
        row = await pool.fetchrow(queries.CREATE_USER, payload.email, payload.name, hashed)
        return {"user": dict(row)}
    except Exception as exc:
        logger.exception("Error in signup: %s", exc)
        rethrow_db_error(exc)


@router.post("/login")
async def login(request: Request, payload: LoginPayload):
    try:
        pool = request.app.state.pool
        row = await pool.fetchrow(queries.GET_USER_AUTH, payload.email)
        if not row or not verify_password(payload.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = create_access_token(row["id"])
        return {"access_token": token, "token_type": "bearer"}
    except Exception as exc:
        logger.exception("Error in login: %s", exc)
        rethrow_db_error(exc)


@router.post("/token")
async def get_token(request: Request, payload: LoginPayload):
    try:
        return await login(request, payload)
    except Exception as exc:
        logger.exception("Error in get_token: %s", exc)
        rethrow_db_error(exc)


@router.get("/me")
async def get_current_user(request: Request):
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.lower().startswith("bearer "):
            raise HTTPException(status_code=401, detail="Missing auth token")

        token = auth_header.split(" ", 1)[1].strip()
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        pool = request.app.state.pool
        row = await pool.fetchrow(queries.GET_USER_BY_ID, user_id)
        if not row:
            raise HTTPException(status_code=401, detail="User not found")
        return {"user": dict(row)}
    except Exception as exc:
        logger.exception("Error in get_current_user: %s", exc)
        rethrow_db_error(exc)


@router.post("/logout")
async def logout(_: Request):
    try:
        return {"message": "Logged out successfully"}
    except Exception as exc:
        logger.exception("Error in logout: %s", exc)
        rethrow_db_error(exc)

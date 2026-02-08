import asyncpg
from fastapi import HTTPException


def rethrow_db_error(exc: Exception) -> None:
    if isinstance(exc, HTTPException):
        raise exc
    if isinstance(exc, asyncpg.PostgresError):
        raise HTTPException(status_code=500, detail="Database operation failed") from exc
    raise HTTPException(status_code=500, detail="Internal Server Error") from exc

import logging

import asyncpg
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"error": "Validation failed", "details": exc.errors()},
    )


async def asyncpg_exception_handler(_: Request, exc: asyncpg.PostgresError) -> JSONResponse:
    logger.exception("PostgreSQL error: %s", exc)
    return JSONResponse(status_code=500, content={"error": "Database operation failed"})


async def global_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled backend error: %s", exc)
    return JSONResponse(status_code=500, content={"error": "Internal Server Error"})


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(asyncpg.PostgresError, asyncpg_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)

import os
import sys
import time
import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from db import close_pool, init_pool
from auth import auth
from items import items
from step_execution import step_execution
from steps import steps
from workflows import workflow
from utils.error_handlers import register_exception_handlers


def configure_logging() -> None:
    """Configure console logging and optional file logging controlled by env vars.

    Environment variables:
    - `BACKEND_LOG_TO_FILE` (true|false): if true, also write logs to file
    - `BACKEND_LOG_FILE`: path to the log file (default: apps/backend/logs/backend.log)
    - `BACKEND_LOG_LEVEL`: logging level (DEBUG/INFO/etc.)
    """
    level_name = os.getenv("BACKEND_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    # reset root handlers so repeated imports don't duplicate logs
    root = logging.getLogger()
    if root.handlers:
        for h in list(root.handlers):
            root.removeHandler(h)

    fmt = "%(asctime)s %(levelname)s %(name)s %(message)s"
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(logging.Formatter(fmt))
    sh.setLevel(level)
    root.setLevel(level)
    root.addHandler(sh)

    if os.getenv("BACKEND_LOG_TO_FILE", "false").lower() in ("1", "true", "yes"):
        log_file = os.getenv("BACKEND_LOG_FILE", "apps/backend/logs/backend.log")
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        fh = logging.FileHandler(log_file)
        fh.setFormatter(logging.Formatter(fmt))
        fh.setLevel(level)
        root.addHandler(fh)


configure_logging()

app = FastAPI(title="Create-Anything Backend")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger = logging.getLogger("backend.request")
    start_time = time.time()
    try:
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000
        logger.info("%s %s %s %.2fms", request.method, request.url.path, response.status_code, duration_ms)
        return response
    except Exception as exc:
        # log full stack trace to console (and file handler if enabled)
        logger.exception("Unhandled exception handling request %s %s", request.method, request.url.path)
        raise

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await init_pool(app)


@app.on_event("shutdown")
async def shutdown():
    await close_pool(app)


register_exception_handlers(app)

app.include_router(workflow.router, prefix="/api/workflows", tags=["workflows"])
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(steps.router, prefix="/api/steps", tags=["steps"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(step_execution.router, prefix="/api/executions", tags=["executions"])

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import close_pool, init_pool
from routers import auth, items, step_execution, steps, workflows
from utils.error_handlers import register_exception_handlers

app = FastAPI(title="Create-Anything Backend")

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

app.include_router(workflows.router, prefix="/api/workflows", tags=["workflows"])
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(steps.router, prefix="/api/steps", tags=["steps"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(step_execution.router, prefix="/api/executions", tags=["executions"])

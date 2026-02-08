from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from db import init_pool, close_pool
from routers import workflows, items, steps, auth, step_execution

app = FastAPI(title="Create-Anything Backend")

# CORS: allow dev frontend origins
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

# startup/shutdown DB pool
@app.on_event("startup")
async def startup():
    await init_pool(app)

@app.on_event("shutdown")
async def shutdown():
    await close_pool(app)

# global exception handler (returns JSON)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # log server-side
    # replace with Sentry or other later
    print("[backend] unhandled error:", exc)
    return JSONResponse({"error": "Internal Server Error"}, status_code=500)

# include routers
app.include_router(workflows.router, prefix="/api/workflows", tags=["workflows"])
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(steps.router, prefix="/api/steps", tags=["steps"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(step_execution.router, prefix="/api/executions", tags=["executions"])
import os
import asyncpg
from contextlib import asynccontextmanager

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL or NEON_DATABASE_URL must be set for backend.")

async def init_pool(app):
    app.state.pool = await asyncpg.create_pool(dsn=DATABASE_URL, min_size=1, max_size=10)

async def close_pool(app):
    await app.state.pool.close()

async def fetch(sql, *args):
    async with app_state_pool() as pool:
        rows = await pool.fetch(sql, *args)
        return [dict(r) for r in rows]

async def fetchrow(sql, *args):
    async with app_state_pool() as pool:
        row = await pool.fetchrow(sql, *args)
        return dict(row) if row else None

async def execute(sql, *args):
    async with app_state_pool() as pool:
        return await pool.execute(sql, *args)

@asynccontextmanager
async def app_state_pool():
    # helper used when app context is not available; callers inside FastAPI should use request.app.state.pool
    # attempt to read a global if available (for scripts), otherwise raise
    try:
        from fastapi import Request
    except Exception:
        pass
    # This yields a helper object that proxies to the pool in FastAPI app handlers.
    # In practice route handlers will read request.app.state.pool directly.
    yield global_pool_proxy()

def global_pool_proxy():
    # placeholder for tools that need a pool outside request/ app context.
    raise RuntimeError("Use request.app.state.pool inside FastAPI request handlers.")
import os
import asyncpg
from typing import Optional

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL or NEON_DATABASE_URL must be set for backend.")


async def init_pool(app):
    """Initialize database connection pool on app startup"""
    try:
        app.state.pool = await asyncpg.create_pool(
            dsn=DATABASE_URL,
            min_size=int(os.getenv("DB_POOL_MIN_SIZE", "1")),
            max_size=int(os.getenv("DB_POOL_MAX_SIZE", "10")),
            command_timeout=60,
        )
        print("[db] Connection pool initialized successfully")
    except Exception as e:
        print(f"[db] Failed to initialize connection pool: {e}")
        raise


async def close_pool(app):
    """Close database connection pool on app shutdown"""
    if hasattr(app.state, "pool") and app.state.pool:
        await app.state.pool.close()
        print("[db] Connection pool closed")


async def execute_migrations(pool):
    """Run database migrations if needed"""
    try:
        # Create migrations table if it doesn't exist
        await pool.execute(
            """
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                run_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        print("[db] Migrations table ready")
    except Exception as e:
        print(f"[db] Error setting up migrations table: {e}")


async def get_pool(request):
    """Helper to get pool from request context"""
    if not hasattr(request.app.state, "pool"):
        raise RuntimeError("Database pool not initialized")
    return request.app.state.pool

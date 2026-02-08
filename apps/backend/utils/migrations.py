import os
import sys
import asyncio
import logging
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

logger = logging.getLogger("backend.migrations")


def _migrations_dir() -> Path:
    # migrations dir relative to apps/backend (this file is in apps/backend/utils)
    return Path(__file__).resolve().parent.parent / "migrations"


async def ensure_migrations_table(conn: asyncpg.Connection) -> None:
    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          run_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        """
    )


async def get_applied(conn: asyncpg.Connection) -> set:
    rows = await conn.fetch("SELECT name FROM migrations ORDER BY id")
    return {r["name"] for r in rows}


async def apply_migration(conn: asyncpg.Connection, name: str, sql: str) -> None:
    # run inside a transaction and record the migration name
    async with conn.transaction():
        await conn.execute(sql)
        await conn.execute("INSERT INTO migrations(name) VALUES($1)", name)


async def run() -> None:
    load_dotenv()
    database_url = os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")
    if not database_url:
        logger.error("No DATABASE_URL or NEON_DATABASE_URL found in environment.")
        sys.exit(1)

    migrations_dir = _migrations_dir()
    migrations_dir.mkdir(parents=True, exist_ok=True)

    pool = await asyncpg.create_pool(dsn=database_url, min_size=1, max_size=5, command_timeout=60)
    try:
        async with pool.acquire() as conn:
            await ensure_migrations_table(conn)
            applied = await get_applied(conn)

        files = sorted([p.name for p in migrations_dir.iterdir() if p.suffix == ".sql"])
        if not files:
            logger.info("no migrations found in %s", migrations_dir)
            return

        for fname in files:
            if fname in applied:
                logger.info("skipping already applied: %s", fname)
                continue

            path = migrations_dir / fname
            logger.info("applying %s", fname)
            sql = path.read_text(encoding="utf8")

            async with pool.acquire() as conn:
                try:
                    await apply_migration(conn, fname, sql)
                    logger.info("applied %s", fname)
                except Exception:
                    logger.exception("failed to apply migration %s", fname)
                    raise

        logger.info("migrations complete")
    finally:
        await pool.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    try:
        asyncio.run(run())
    except Exception as e:
        logger.exception("Migration runner failed: %s", e)
        sys.exit(1)
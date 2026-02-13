import os
import asyncio
import asyncpg
import argparse
import sys


def quote_ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


async def gather_tables(conn):
    rows = await conn.fetch(
        """
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT IN ('migrations')
        ORDER BY tablename
        """
    )
    return [r['tablename'] for r in rows]


async def clear_database(dsn: str, assume_yes: bool = False):
    conn = await asyncpg.connect(dsn)
    try:
        tables = await gather_tables(conn)
        if not tables:
            print("No user tables found to truncate.")
            return

        print("The following tables will be truncated (data only):")
        for t in tables:
            print(f" - {t}")

        if not assume_yes:
            resp = input("Proceed and remove ALL data from these tables? [y/N]: ").strip().lower()
            if resp not in ("y", "yes"):
                print("Aborting. No changes made.")
                return

        qnames = ", ".join(quote_ident(t) for t in tables)
        stmt = f"TRUNCATE TABLE {qnames} RESTART IDENTITY CASCADE;"
        await conn.execute(stmt)
        print("Database cleared of data (schema preserved).")
    finally:
        await conn.close()


def main():
    parser = argparse.ArgumentParser(description="Clear all user data from the database (schema kept).")
    parser.add_argument("--yes", "-y", action="store_true", help="Skip confirmation prompt and run immediately.")
    parser.add_argument("--database-url", "-d", help="Database DSN (defaults to DATABASE_URL env var)")
    args = parser.parse_args()

    dsn = args.database_url or os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")
    if not dsn:
        print("DATABASE_URL or NEON_DATABASE_URL environment variable must be set.")
        sys.exit(2)

    try:
        asyncio.run(clear_database(dsn, assume_yes=args.y))
    except Exception as e:
        print(f"Error clearing database: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

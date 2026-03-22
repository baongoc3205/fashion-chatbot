"""
Database connection pool using asyncpg.
Connects directly to the same PostgreSQL instance used by Prisma/Next.js.
"""

import os
import asyncpg
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/fashion_chatbot")

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    """Get or create the asyncpg connection pool."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    return _pool


async def close_pool():
    """Close the connection pool on shutdown."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

#!/usr/bin/env python3
"""Exit 0 when DATABASE_URL is reachable; uses same URL normalization as the FastAPI app."""

from __future__ import annotations

import os
import sys
from pathlib import Path

# `python scripts/wait_for_db.py` puts `scripts/` first on sys.path, so `app` is not found unless root is added.
_backend_root = Path(__file__).resolve().parents[1]
if str(_backend_root) not in sys.path:
    sys.path.insert(0, str(_backend_root))

from sqlalchemy import create_engine, text

from app.core.config import normalize_database_url


def main() -> int:
    raw = os.environ.get("DATABASE_URL")
    if not raw:
        print("DATABASE_URL is not set", file=sys.stderr)
        return 1

    url = normalize_database_url(raw.strip())
    timeout_s = int(os.environ.get("DB_CONNECT_TIMEOUT", "30"))

    try:
        engine = create_engine(
            url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": timeout_s},
        )
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        print(f"Database not reachable ({url.split('@')[-1]}): {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/bin/sh
set -e

echo "Waiting for database..."
until python -c "
import os
import sys
from sqlalchemy import create_engine, text

url = os.environ.get('DATABASE_URL')
if not url:
    sys.exit(1)
engine = create_engine(url, pool_pre_ping=True)
with engine.connect() as conn:
    conn.execute(text('SELECT 1'))
" 2>/dev/null; do
  echo "Database not ready, retrying in 2s..."
  sleep 2
done

echo "Running migrations..."
alembic upgrade head

if [ "${RUN_SEED_ON_START:-false}" = "true" ]; then
  echo "Running seed..."
  python -m app.db.seed
fi

port="${PORT:-8000}"
echo "Starting API on port ${port}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${port}"

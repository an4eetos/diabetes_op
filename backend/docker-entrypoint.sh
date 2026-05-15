#!/bin/sh
set -e

echo "Waiting for database..."
until python scripts/wait_for_db.py; do
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

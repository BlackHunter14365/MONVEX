#!/bin/sh
set -e

echo "[MONVEX] Running database migrations..."
python manage.py migrate --noinput

echo "[MONVEX] Collecting static files..."
python manage.py collectstatic --noinput

echo "[MONVEX] Starting Gunicorn on port ${PORT:-8000}..."
exec gunicorn monvex.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 120

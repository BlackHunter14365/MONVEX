# Multi-stage production build for MONVEX Django Backend
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt gunicorn uvicorn

# Final Runtime Image
FROM python:3.12-slim AS runner

WORKDIR /app

# Install runtime dependencies (e.g. postgres client libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application source code
COPY . .

# Create unprivileged user for security
RUN useradd -m -u 1000 monvex && chown -R monvex:monvex /app
USER monvex

EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=monvex.settings

CMD ["gunicorn", "monvex.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]

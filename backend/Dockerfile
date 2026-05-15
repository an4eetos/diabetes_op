# Builder: compilers only here — final image has no build-essential / gcc toolchain (~ hundreds of MB saved).
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      build-essential \
      libffi-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app
ENV PYTHONPATH=/app

# Runtime libs for WeasyPrint + PDF/fonts — no -dev or compiler packages.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      fonts-dejavu-core \
      libcairo2 \
      libgdk-pixbuf-2.0-0 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY . .
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]

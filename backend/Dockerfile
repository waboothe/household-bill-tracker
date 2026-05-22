# Backend image for the Household Bill Tracker.
# Tiny: just Python + the FastAPI deps. Data lives in a mounted volume so
# rebuilding the image never wipes your bill history.
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install deps first for layer caching. We pin via pyproject.toml ranges;
# `uv` would be faster but plain pip keeps the image dependency-free.
COPY pyproject.toml ./
RUN pip install --no-cache-dir \
      "fastapi>=0.115" \
      "uvicorn[standard]>=0.32" \
      "pydantic>=2.9"

COPY app ./app

# /data is the SQLite home. Compose mounts a named volume here.
RUN mkdir -p /data
ENV BILL_TRACKER_DB=/data/bills.db

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request,sys; \
    sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/health').status==200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

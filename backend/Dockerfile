FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Preparar directorio de efemérides (pyswisseph usará Moshier si no hay .se1 files)
RUN mkdir -p /usr/share/swisseph/ephe

COPY . .

# Create non-root user for security
RUN useradd -m -u 1000 astro && chown -R astro:astro /app /usr/share/swisseph
USER astro

ENV EPHE_PATH=/usr/share/swisseph/ephe

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

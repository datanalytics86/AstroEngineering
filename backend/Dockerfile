FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Efemérides oficiales Swiss Ephemeris (Anexo C) — SHA-256 verificado.
ENV EPHE_PATH=/usr/share/swisseph/ephe
RUN mkdir -p "$EPHE_PATH" \
 && cd "$EPHE_PATH" \
 && curl -fsSL -o sepl_18.se1 https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/sepl_18.se1 \
 && curl -fsSL -o semo_18.se1 https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/semo_18.se1 \
 && curl -fsSL -o seas_18.se1 https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/seas_18.se1 \
 && echo "ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66  sepl_18.se1" | sha256sum -c - \
 && echo "1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7  semo_18.se1" | sha256sum -c - \
 && echo "a2cd8fc33807c78ca9a700c91c2e042258b12fc4796519e00781440b5ad8b2e2  seas_18.se1" | sha256sum -c -

COPY . .

RUN useradd -m -u 1000 astro && chown -R astro:astro /app /usr/share/swisseph
USER astro

EXPOSE 8000

# WEB_CONCURRENCY: 1 en free (RAM); 2 en Starter. N workers = N caches LRU (AD-07).
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY:-1}"]

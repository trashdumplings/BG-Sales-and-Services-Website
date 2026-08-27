FROM python:3.13.15-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY services/backend/server/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/backend/server ./server

RUN groupadd --gid 10001 app \
    && useradd --uid 10001 --gid app --no-create-home app \
    && mkdir -p /app/uploads \
    && chown -R app:app /app

USER 10001:10001

EXPOSE 8000

# --proxy-headers trusts X-Forwarded-Proto/Host from upstream so ENFORCE_HTTPS's redirect
# middleware sees the real scheme instead of looping. Safe to trust from any peer here because
# this container is never published directly to the host in production (see docker-compose.prod.yml)
# — the only thing that can ever connect is the Caddy reverse proxy on the internal compose network.
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips=*"]

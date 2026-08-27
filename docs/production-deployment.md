# Production deployment runbook

This runbook assumes a clean Ubuntu 24.04 LTS VPS, a domain you control, and deployment from the repository root. Do not launch until every item in the preflight section is complete.

## 1. Information required

- VPS public IPv4 address and, if configured, IPv6 address
- Root domain (for example `example.com`)
- An email address for ACME certificate notices
- SMTP provider credentials if email notifications are required
- A named operator responsible for backups and incident response

## 2. VPS baseline

Create a non-root sudo user, use SSH keys, disable password-based SSH and direct root login, enable unattended security upgrades, and enable a firewall. Before enabling the firewall, confirm the actual SSH port.

```sh
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Install Docker Engine and the Compose plugin from Docker's official Ubuntu repository. Do not publish PostgreSQL, the API, or pgAdmin to public interfaces; the production Compose file publishes only Caddy on ports 80 and 443, with pgAdmin restricted to loopback.

## 3. DNS

Create `A` records for the root domain, `www`, and `api` pointing to the VPS. Add `AAAA` records only if IPv6 is correctly routed and firewalled. Remove stale records. Verify from an external resolver before starting Caddy:

```sh
dig +short example.com A
dig +short www.example.com A
dig +short api.example.com A
```

## 4. Configuration and secrets

```sh
cp .env.production.example .env
mkdir -m 700 secrets backups
openssl rand -base64 48 > secrets/postgres_password
openssl rand -base64 48 > secrets/pgadmin_password
openssl rand -base64 64 > secrets/jwt_secret
touch secrets/smtp_password
chmod 600 .env secrets/*
```

Edit `.env` with the real domain, allowed origins, trusted hosts, ACME email, database name/user, pgAdmin email, and SMTP settings. Secret files contain one raw value without quotes. Never commit `.env`, `secrets/`, or `backups/`.

## 5. Preflight and first deployment

```sh
docker compose -f docker-compose.prod.yml --env-file .env config --quiet
docker compose -f docker-compose.prod.yml --env-file .env build --pull
docker compose -f docker-compose.prod.yml --env-file .env up -d
docker compose -f docker-compose.prod.yml --env-file .env ps
docker compose -f docker-compose.prod.yml --env-file .env logs --tail=200 migrate core caddy
```

The `migrate` container must exit with code 0, and `postgres`, `core`, `frontend`, and `caddy` must be healthy/running. From a machine outside the VPS, verify:

```sh
curl --fail --show-error https://api.example.com/ready
curl --fail --show-error https://example.com/health
curl -I https://www.example.com
```

Confirm the certificate covers all three names, HTTP redirects to HTTPS, public registration is disabled, API documentation returns 404, and pgAdmin is unreachable on the VPS public IP.

## 6. Backups and restore drill

Create a backup immediately:

```sh
docker compose -f docker-compose.prod.yml --env-file .env --profile ops run --rm backup
sha256sum -c backups/checksums-*.sha256
```

Schedule that command daily with a systemd timer or root cron. Copy backups to encrypted off-server storage; local VPS backups do not protect against server loss. Monitor failures and free disk space.

Test restoration before launch on a disposable database/stack. A production restore is destructive and requires an explicit confirmation:

```sh
BACKUP_FILE=/backups/database-YYYYMMDDTHHMMSSZ.dump \
CONFIRM_RESTORE=restore-bgsale_portal \
docker compose -f docker-compose.prod.yml --env-file .env --profile ops run --rm restore
```

To restore uploads too, additionally set `RESTORE_UPLOADS=true` and `UPLOAD_BACKUP_FILE=/backups/uploads-YYYYMMDDTHHMMSSZ.tar.gz`.

## 7. Updates and rollback

Before every deployment, create and copy a backup off-server. Deploy an immutable reviewed commit, rebuild, and watch migrations and health checks. Database migrations may make application rollback unsafe; confirm the migration downgrade path before reverting code. Keep the previous images until the new release has passed smoke tests.

## 8. Launch gate

- CI is green and required by branch protection.
- Production and build dependency audits are reviewed.
- Fresh-database migration and full-stack smoke test pass on the VPS.
- DNS and TLS pass externally.
- Strong unique secrets are installed with mode `0600`.
- No default application accounts/passwords remain.
- Daily backups run, are copied off-server, and a restore drill has passed.
- Monitoring covers uptime, disk, memory, certificate expiry, backup failure, and 5xx errors.
- An operator knows how to disable traffic, inspect logs, restore data, and contact the domain/VPS providers.

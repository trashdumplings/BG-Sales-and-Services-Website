import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')

test('production example enables release security guards', async () => {
  const env = await read('.env.production.example')
  assert.match(env, /^APP_DEBUG=false$/m)
  assert.match(env, /^ALLOW_PUBLIC_REGISTRATION=false$/m)
  assert.match(env, /^AUTO_CREATE_TABLES=false$/m)
  assert.match(env, /^ENFORCE_HTTPS=true$/m)
  assert.match(env, /^CORS_ORIGINS=https:\/\//m)
})

test('nginx serves SPA routes and security headers', async () => {
  const config = await read('docker/nginx/default.conf')
  assert.match(config, /try_files\s+\$uri\s+\$uri\/\s+\/index\.html/)
  assert.match(config, /X-Frame-Options\s+"DENY"/)
  assert.match(config, /X-Content-Type-Options\s+"nosniff"/)
  assert.match(config, /Content-Security-Policy/)
  assert.match(config, /frame-ancestors 'none'/)
})

test('frontend does not disguise API and sensitive paths as SPA routes', async () => {
  const config = await read('docker/nginx/default.conf')
  assert.match(config, /\(\?:api\|auth\|admin\|uploads\)/)
  assert.match(config, /location = \/robots\.txt/)
  assert.match(config, /location = \/sitemap\.xml/)
  assert.match(config, /\.\(\?:map\|env\|ini\|log\|sql\|bak\|old\)/)
})

test('development database, admin, and API ports are loopback-only', async () => {
  const compose = await read('docker-compose.yml')
  assert.match(compose, /127\.0\.0\.1:\$\{POSTGRES_PORT:-5432\}:5432/)
  assert.match(compose, /127\.0\.0\.1:\$\{PGADMIN_PORT:-5050\}:80/)
  assert.match(compose, /127\.0\.0\.1:\$\{CORE_PORT:-8000\}:8000/)
})

test('backend minimizes production discovery and narrows CORS capabilities', async () => {
  const app = await read('services/backend/server/main.py')
  assert.match(app, /if settings\.DEBUG:\s+response\["endpoints"\]/)
  assert.match(app, /allow_methods=\["GET", "POST", "PUT", "DELETE", "OPTIONS"\]/)
  assert.match(app, /allow_headers=\["Authorization", "Content-Type"\]/)
  assert.doesNotMatch(app, /allow_methods=\["\*"\]/)
  assert.doesNotMatch(app, /allow_headers=\["\*"\]/)
})

test('production proxy enables long-lived HSTS', async () => {
  const config = await read('docker/caddy/Caddyfile')
  assert.match(config, /Strict-Transport-Security/)
  assert.match(config, /max-age=31536000/)
})

test('public registration is disabled in production builds', async () => {
  const env = await read('.env.production.example')
  const compose = await read('docker-compose.prod.yml')
  const app = await read('services/frontend/src/App.jsx')
  assert.match(env, /^VITE_ALLOW_PUBLIC_REGISTRATION=false$/m)
  assert.match(compose, /VITE_ALLOW_PUBLIC_REGISTRATION/)
  assert.match(app, /publicRegistrationEnabled/)
})

test('production build does not generate source maps', async () => {
  const vite = await read('vite.config.js')
  assert.match(vite, /sourcemap:\s*false/)
  assert.match(vite, /drop_debugger:\s*true/)
})

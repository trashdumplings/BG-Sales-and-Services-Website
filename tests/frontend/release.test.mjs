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
})

test('production build does not generate source maps', async () => {
  const vite = await read('vite.config.js')
  assert.match(vite, /sourcemap:\s*false/)
  assert.match(vite, /drop_debugger:\s*true/)
})

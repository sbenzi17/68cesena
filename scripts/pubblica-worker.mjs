// Pubblica il Worker (worker/src/index.js) con le API di Cloudflare, senza wrangler.
// Prende le impostazioni da worker/wrangler.toml e le chiavi da .env.local:
// CLOUDFLARE_API_TOKEN (modello "Edit Cloudflare Workers"), R2_ACCOUNT_ID, SUPABASE_SERVICE_ROLE_KEY.
// Uso: node scripts/pubblica-worker.mjs
import { readFileSync } from 'node:fs'
import { loadEnv } from './env.mjs'

const env = loadEnv()
const toml = readFileSync('worker/wrangler.toml', 'utf8')
const value = (name) => toml.match(new RegExp(`^${name}\\s*=\\s*"([^"]*)"`, 'm'))?.[1]

const api = `https://api.cloudflare.com/client/v4/accounts/${env.R2_ACCOUNT_ID}/workers/scripts/${value('name')}`
const headers = { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` }

async function call(url, init) {
  const res = await fetch(url, { ...init, headers: { ...headers, ...init.headers } })
  const data = await res.json()
  if (!data.success) throw new Error(JSON.stringify(data.errors))
  return data.result
}

const metadata = {
  main_module: 'index.js',
  compatibility_date: value('compatibility_date'),
  keep_bindings: ['secret_text'], // non cancellare la chiave service_role già impostata
  bindings: [
    { type: 'r2_bucket', name: 'BUCKET', bucket_name: value('bucket_name') },
    ...['ALLOWED_ORIGIN', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'].map(name => ({ type: 'plain_text', name, text: value(name) })),
  ],
}
const form = new FormData()
form.append('metadata', JSON.stringify(metadata))
form.append('index.js', new Blob([readFileSync('worker/src/index.js')], { type: 'application/javascript+module' }), 'index.js')
await call(api, { method: 'PUT', body: form })
console.log('Worker caricato')

await call(`${api}/secrets`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'SUPABASE_SERVICE_ROLE_KEY', text: env.SUPABASE_SERVICE_ROLE_KEY, type: 'secret_text' }),
})
console.log('Chiave service_role impostata')

await call(`${api}/subdomain`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"enabled":true}' })
console.log('Indirizzo workers.dev attivo')

// Cloudflare Worker: carica ed elimina file nel bucket R2 per conto del pannello admin.
// Accetta solo utenti che hanno fatto login su Supabase e che sono nella tabella `admin`.
// Le immagini si leggono direttamente dall'URL pubblico del bucket, non da qui.

const KEY_RE = /^(thumbs|large|pdf)\/[A-Za-z0-9._-]+\.(jpg|pdf)$/
const MAX_BYTES = 25 * 1024 * 1024

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

function reply(env, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(env) },
  })
}

async function isAdmin(request, env) {
  const auth = request.headers.get('Authorization') || ''
  if (!auth.startsWith('Bearer ')) return false
  const headers = { apikey: env.SUPABASE_ANON_KEY, Authorization: auth }
  const user = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers })
  if (!user.ok) return false
  const { id } = await user.json()
  const rows = await fetch(`${env.SUPABASE_URL}/rest/v1/admin?select=user_id&user_id=eq.${id}`, { headers })
  return rows.ok && (await rows.json()).length === 1
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(env) })

    const key = new URL(request.url).searchParams.get('key') || ''
    if (!KEY_RE.test(key)) return reply(env, 400, { error: 'chiave non valida' })
    if (!(await isAdmin(request, env))) return reply(env, 401, { error: 'non autorizzato' })

    if (request.method === 'PUT') {
      const size = Number(request.headers.get('Content-Length') || 0)
      if (size > MAX_BYTES) return reply(env, 413, { error: 'file troppo grande' })
      const contentType = key.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
      await env.BUCKET.put(key, request.body, { httpMetadata: { contentType, cacheControl: 'public, max-age=86400' } })
      return reply(env, 200, { ok: true, key })
    }

    if (request.method === 'DELETE') {
      await env.BUCKET.delete(key)
      return reply(env, 200, { ok: true, key })
    }

    return reply(env, 405, { error: 'metodo non ammesso' })
  },
}

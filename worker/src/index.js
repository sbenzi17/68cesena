// Cloudflare Worker al servizio del pannello admin:
// - /?key=...   legge, carica ed elimina file nel bucket R2 (immagini, PDF e config/evento.json)
// - /utenti     elenca, crea, modifica ed elimina gli amministratori (usa la chiave service_role di Supabase)
// - /storico/ID elimina una riga dello storico delle modifiche
// - /stato      spazio usato su R2 e dimensione del database, per la pagina "Stato" del pannello
// Le scritture sono permesse solo a utenti con login Supabase presenti nella tabella `admin`.
// Le immagini per il pubblico si leggono direttamente dall'URL pubblico del bucket, non da qui.

const KEY_RE = /^((thumbs|large|pdf)\/[A-Za-z0-9._-]+\.(jpg|pdf)|config\/evento\.json)$/
const contentTypes = { jpg: 'image/jpeg', pdf: 'application/pdf', json: 'application/json' }
const MAX_BYTES = 25 * 1024 * 1024

// ALLOWED_ORIGIN può elencare più indirizzi separati da virgola; in più è accettato localhost su qualsiasi porta
// (prove in locale: per scrivere serve comunque il login da admin). env.ORIGIN è l'origine della richiesta in corso
function cors(env) {
  const allowed = env.ALLOWED_ORIGIN.split(',').map(s => s.trim())
  const ok = allowed.includes(env.ORIGIN) || /^http:\/\/localhost:\d+$/.test(env.ORIGIN)
  return {
    'Access-Control-Allow-Origin': ok ? env.ORIGIN : allowed[0],
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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

// Restituisce l'id dell'utente se è un amministratore, altrimenti null
async function adminId(request, env) {
  const auth = request.headers.get('Authorization') || ''
  if (!auth.startsWith('Bearer ')) return null
  const headers = { apikey: env.SUPABASE_ANON_KEY, Authorization: auth }
  const user = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers })
  if (!user.ok) return null
  const { id } = await user.json()
  const rows = await fetch(`${env.SUPABASE_URL}/rest/v1/admin?select=user_id&user_id=eq.${id}`, { headers })
  return rows.ok && (await rows.json()).length === 1 ? id : null
}

// Chiamata a Supabase con la chiave service_role (solo dentro il Worker)
async function service(env, path, method = 'GET', body) {
  const res = await fetch(`${env.SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: body && JSON.stringify(body),
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(data?.msg || data?.message || data?.error_description || `errore ${res.status}`)
  return data
}

async function files(request, env, url) {
  const key = url.searchParams.get('key') || ''
  if (!KEY_RE.test(key)) return reply(env, 400, { error: 'chiave non valida' })

  // Lettura libera (i file sono comunque pubblici): serve al sito per leggere l'evento in evidenza
  if (request.method === 'GET') {
    const obj = await env.BUCKET.get(key)
    if (!obj) return reply(env, 404, { error: 'file non trovato' })
    return new Response(obj.body, {
      headers: {
        'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
        ...(key.endsWith('.json') && { 'Cache-Control': 'no-store' }),
        ...cors(env),
      },
    })
  }

  if (!(await adminId(request, env))) return reply(env, 401, { error: 'non autorizzato' })

  if (request.method === 'PUT') {
    const size = Number(request.headers.get('Content-Length') || 0)
    if (size > MAX_BYTES) return reply(env, 413, { error: 'file troppo grande' })
    const contentType = contentTypes[key.split('.').pop()]
    const cacheControl = key.endsWith('.json') ? 'no-store' : 'public, max-age=86400'
    await env.BUCKET.put(key, request.body, { httpMetadata: { contentType, cacheControl } })
    return reply(env, 200, { ok: true, key })
  }

  if (request.method === 'DELETE') {
    await env.BUCKET.delete(key)
    return reply(env, 200, { ok: true, key })
  }

  return reply(env, 405, { error: 'metodo non ammesso' })
}

async function utenti(request, env, url) {
  const me = await adminId(request, env)
  if (!me) return reply(env, 401, { error: 'non autorizzato' })
  const id = url.pathname.split('/')[2] || ''
  if (id && !/^[0-9a-f-]{36}$/.test(id)) return reply(env, 400, { error: 'utente non valido' })
  const body = ['POST', 'PATCH'].includes(request.method) ? await request.json() : {}
  if (body.password !== undefined && String(body.password).length < 8) {
    return reply(env, 400, { error: 'la password deve avere almeno 8 caratteri' })
  }

  if (request.method === 'GET' && !id) {
    const admins = await service(env, '/rest/v1/admin?select=user_id,nome')
    const list = await Promise.all(admins.map(async (a) => {
      const u = await service(env, `/auth/v1/admin/users/${a.user_id}`).catch(() => ({}))
      return { id: a.user_id, nome: a.nome, email: u.email, ultimoAccesso: u.last_sign_in_at, creato: u.created_at }
    }))
    return reply(env, 200, { me, utenti: list })
  }

  if (request.method === 'POST' && !id) {
    const nome = String(body.nome || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    if (!nome || !email || !body.password) return reply(env, 400, { error: 'nome, email e password sono obbligatori' })
    const user = await service(env, '/auth/v1/admin/users', 'POST', { email, password: body.password, email_confirm: true })
    await service(env, '/rest/v1/admin', 'POST', { user_id: user.id, nome })
    return reply(env, 200, { ok: true, id: user.id })
  }

  if (request.method === 'PATCH' && id) {
    if (body.password) await service(env, `/auth/v1/admin/users/${id}`, 'PUT', { password: body.password })
    if (body.nome) await service(env, `/rest/v1/admin?user_id=eq.${id}`, 'PATCH', { nome: String(body.nome).trim() })
    return reply(env, 200, { ok: true })
  }

  if (request.method === 'DELETE' && id) {
    if (id === me) return reply(env, 400, { error: 'non puoi eliminare il tuo stesso account' })
    await service(env, `/auth/v1/admin/users/${id}`, 'DELETE') // la riga in `admin` si cancella a cascata
    return reply(env, 200, { ok: true })
  }

  return reply(env, 405, { error: 'metodo non ammesso' })
}

// Elimina una riga dello storico (la tabella è in sola lettura per gli admin, quindi passa da qui)
async function storico(request, env, url) {
  if (!(await adminId(request, env))) return reply(env, 401, { error: 'non autorizzato' })
  const id = url.pathname.split('/')[2] || ''
  if (request.method !== 'DELETE' || !/^\d+$/.test(id)) return reply(env, 400, { error: 'richiesta non valida' })
  await service(env, `/rest/v1/schede_storico?id=eq.${id}`, 'DELETE')
  return reply(env, 200, { ok: true })
}

// Stato dei servizi per la pagina "Stato" del pannello: spazio su R2 e dimensione del database
async function stato(request, env) {
  if (!(await adminId(request, env))) return reply(env, 401, { error: 'non autorizzato' })
  const r2 = { bytes: 0, objects: 0, perCartella: {} }
  let cursor
  do {
    const page = await env.BUCKET.list({ cursor, limit: 1000 })
    for (const o of page.objects) {
      const dir = o.key.split('/')[0]
      r2.bytes += o.size
      r2.objects++
      r2.perCartella[dir] = (r2.perCartella[dir] || 0) + o.size
    }
    cursor = page.truncated ? page.cursor : null
  } while (cursor)
  // la funzione dimensione_database() va creata una volta nel database (vedi supabase/schema.sql)
  const dbBytes = await service(env, '/rest/v1/rpc/dimensione_database', 'POST', {}).catch(() => null)
  return reply(env, 200, { r2, db: { bytes: typeof dbBytes === 'number' ? dbBytes : null } })
}

export default {
  async fetch(request, workerEnv) {
    const env = { ...workerEnv, ORIGIN: request.headers.get('Origin') || '' }
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(env) })
    const url = new URL(request.url)
    try {
      if (url.pathname.startsWith('/utenti')) return await utenti(request, env, url)
      if (url.pathname.startsWith('/storico/')) return await storico(request, env, url)
      if (url.pathname === '/stato') return await stato(request, env)
      return await files(request, env, url)
    } catch (err) {
      return reply(env, 500, { error: err.message })
    }
  },
}

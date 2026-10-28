import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// URL pubblico del bucket R2 (immagini e PDF) e del Worker che gestisce i caricamenti
export const IMG_BASE = (import.meta.env.VITE_IMG_BASE || '').replace(/\/$/, '')
export const WORKER_URL = (import.meta.env.VITE_WORKER_URL || '').replace(/\/$/, '')

// Senza configurazione il sito funziona in modalità demo (catalogo.json + modifiche nel browser)
export const hasBackend = Boolean(url && anonKey && IMG_BASE)

export const supabase = hasBackend ? createClient(url, anonKey) : null

export async function isAdmin() {
  if (!hasBackend) return true
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  const { data } = await supabase.from('admin').select('user_id').eq('user_id', session.user.id)
  return data?.length === 1
}

export async function currentUserId() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user.id || null
}

// Chiamata al Worker con il login dell'admin; restituisce il JSON o lancia l'errore spiegato dal Worker
async function worker(path, { method = 'GET', body, contentType } = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${WORKER_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      ...(contentType && { 'Content-Type': contentType }),
    },
    body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `errore ${res.status}`)
  return data
}

// Carica un file nel bucket tramite il Worker (solo admin)
export async function uploadFile(key, blob) {
  try {
    await worker(`?key=${encodeURIComponent(key)}`, { method: 'PUT', body: blob, contentType: blob.type })
  } catch (err) {
    throw new Error(`Caricamento di ${key} non riuscito: ${err.message}`)
  }
}

// Gestione degli amministratori (passa dal Worker, che usa la chiave service_role)
export const listUsers = () => worker('/utenti')
export const createUser = (u) => worker('/utenti', { method: 'POST', body: JSON.stringify(u), contentType: 'application/json' })
export const updateUser = (id, changes) => worker(`/utenti/${id}`, { method: 'PATCH', body: JSON.stringify(changes), contentType: 'application/json' })
export const removeUser = (id) => worker(`/utenti/${id}`, { method: 'DELETE' })

// Spazio usato su R2 e dimensione del database (pagina "Stato")
export const loadStato = () => worker('/stato')

// Righe dello storico: si eliminano solo passando dal Worker
export const deleteStoricoRow = (id) => worker(`/storico/${id}`, { method: 'DELETE' })

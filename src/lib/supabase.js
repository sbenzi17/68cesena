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

// Carica un file nel bucket tramite il Worker (solo admin)
export async function uploadFile(key, blob) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`${WORKER_URL}?key=${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': blob.type },
    body: blob,
  })
  if (!res.ok) throw new Error(`Caricamento di ${key} non riuscito (${res.status})`)
}

export async function deleteFile(key) {
  const { data: { session } } = await supabase.auth.getSession()
  await fetch(`${WORKER_URL}?key=${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
}

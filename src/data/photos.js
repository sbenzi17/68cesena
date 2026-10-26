// Unico punto di accesso ai dati del catalogo.
// Con Supabase configurato (.env.production) legge e scrive sul database e le immagini stanno su R2;
// altrimenti usa catalogo.json e salva le modifiche solo nel browser (modalità demo).
// Il catalogo viene caricato tutto all'avvio (loadCatalogo) e poi filtrato in memoria.
import { supabase, hasBackend, IMG_BASE, uploadFile, deleteFile } from '../lib/supabase'

const BASE = import.meta.env.BASE_URL
const EDITS_KEY = 'archivio-modifiche-demo'

let cache = []

const fromDb = (r) => ({
  id: r.id, status: r.status, fondo: r.fondo, serie: r.serie, titolo: r.titolo, autore: r.autore,
  luogoStampa: r.luogo_stampa, data: r.data, dataOrd: r.data_ord, citta: r.citta, luogo: r.luogo,
  evento: r.evento, formazione: r.formazione, persone: r.persone, parole: r.parole,
  sequenza: r.sequenza, tipologia: r.tipologia, supporto: r.supporto, dimensioni: r.dimensioni,
  orientamento: r.orientamento, colore: r.colore, particolare: r.particolare, fronteRetro: r.fronte_retro,
  pagine: r.pagine, note: r.note, immagini: r.immagini, pdf: r.pdf, updatedAt: r.updated_at,
})

const toDb = (r) => ({
  id: r.id, status: r.status || 'ok', fondo: r.fondo, serie: r.serie, titolo: r.titolo, autore: r.autore,
  luogo_stampa: r.luogoStampa, data: r.data, data_ord: r.dataOrd, citta: r.citta, luogo: r.luogo,
  evento: r.evento, formazione: r.formazione || [], persone: r.persone || [], parole: r.parole || [],
  sequenza: r.sequenza, tipologia: r.tipologia, supporto: r.supporto, dimensioni: r.dimensioni,
  orientamento: r.orientamento, colore: r.colore, particolare: r.particolare, fronte_retro: r.fronteRetro,
  pagine: r.pagine, note: r.note, immagini: r.immagini || [], pdf: r.pdf || null,
})

// Modalità demo: modifiche salvate in localStorage
function loadEdits() {
  try { return JSON.parse(localStorage.getItem(EDITS_KEY)) || {} } catch { return {} }
}

export async function loadCatalogo() {
  if (hasBackend) {
    const rows = []
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from('schede').select('*').order('id').range(from, from + 999)
      if (error) throw error
      rows.push(...data)
      if (data.length < 1000) break
    }
    cache = rows.map(fromDb)
    return
  }
  const { default: catalogo } = await import('./catalogo.json')
  const edits = loadEdits()
  const base = catalogo.map(r => ({ ...r, immagini: r.img ? [r.id] : [] }))
  const merged = base.map(r => edits[r.id] ? { ...r, ...edits[r.id] } : r)
  const nuove = Object.values(edits).filter(e => !base.some(r => r.id === e.id))
  cache = [...nuove, ...merged]
}

function allRecords() {
  return cache
}

// Riduce l'immagine nel browser prima del caricamento
export function resizeImage(file, maxSide, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

const blobToDataUrl = (blob) => new Promise((resolve) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.readAsDataURL(blob)
})

// Salva una scheda; `file` (facoltativo) è la nuova immagine principale
export async function saveRecord(record, file) {
  const r = { ...record }
  if (hasBackend) {
    if (file) {
      const name = r.immagini?.[0] || r.id
      await uploadFile(`thumbs/${name}.jpg`, await resizeImage(file, 600, 0.75))
      await uploadFile(`large/${name}.jpg`, await resizeImage(file, 1600, 0.82))
      r.immagini = r.immagini?.length ? r.immagini : [name]
    }
    const { data, error } = await supabase.from('schede').upsert(toDb(r)).select().single()
    if (error) throw error
    Object.assign(r, fromDb(data))
  } else {
    if (file) r.imgData = await blobToDataUrl(await resizeImage(file, 1200, 0.8))
    const edits = loadEdits()
    edits[r.id] = r
    try { localStorage.setItem(EDITS_KEY, JSON.stringify(edits)) } catch { /* storage pieno o non disponibile */ }
  }
  const i = cache.findIndex(x => x.id === r.id)
  if (i >= 0) cache[i] = r
  else cache.unshift(r)
  return r
}

export async function deleteRecord(id) {
  const r = getPhotoDetail(id)
  if (!r) return
  if (hasBackend) {
    const { error } = await supabase.from('schede').delete().eq('id', id)
    if (error) throw error
    for (const name of r.immagini || []) {
      await deleteFile(`thumbs/${name}.jpg`)
      await deleteFile(`large/${name}.jpg`)
    }
    if (r.pdf) await deleteFile(`pdf/${r.pdf}`)
  } else {
    const edits = loadEdits()
    delete edits[id]
    try { localStorage.setItem(EDITS_KEY, JSON.stringify(edits)) } catch { /* ignora */ }
  }
  cache = cache.filter(x => x.id !== id)
}

export function nextId() {
  const max = Math.max(0, ...allRecords().map(r => parseInt(r.id, 10) || 0))
  return String(max + 1).padStart(3, '0')
}

const hasImage = (r) => Boolean(r.imgData || r.immagini?.length)

export function imageUrl(record, size = 'thumbs', index = 0) {
  if (!record) return null
  if (record.imgData) return record.imgData
  const name = record.immagini?.[index]
  if (!name) return null
  if (!hasBackend) return `${BASE}foto/${size}/${name}.jpg`
  // updatedAt evita che il browser mostri la versione vecchia dopo una sostituzione
  const v = record.updatedAt ? `?v=${Date.parse(record.updatedAt)}` : ''
  return `${IMG_BASE}/${size}/${name}.jpg${v}`
}

export function pdfUrl(record) {
  return hasBackend && record?.pdf ? `${IMG_BASE}/pdf/${record.pdf}` : null
}

function shortPlace(r) {
  return [r.citta, r.data].filter(Boolean).join(', ')
}

// Forma usata da Thumb e Lightbox
export function toThumb(r) {
  return {
    id: r.id,
    bg: `bg-${(parseInt(r.id, 10) % 8) + 1}`,
    label: hasImage(r) ? '' : 'Immagine in digitalizzazione',
    caption: [r.titolo, shortPlace(r)].filter(Boolean).join(' · '),
    src: imageUrl(r),
    large: imageUrl(r, 'large'),
  }
}

export function getRecords() {
  return allRecords()
}

export function getPhotoDetail(id) {
  return allRecords().find(r => r.id === id) || null
}

export function recentPhotos() {
  return [...allRecords()]
    .filter(hasImage)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, 12)
    .map(toThumb)
}

export function featuredPhotos(n = 3) {
  return allRecords().filter(r => hasImage(r) && r.serie === 'Fotografie').filter((_, i) => i % 7 === 0).slice(0, n)
}

const year = (r) => (r.dataOrd || '').slice(0, 4)

const campoValues = {
  autore: (r) => [r.autore || 'Anonimo'],
  luogo: (r) => [r.citta, r.luogo].filter(Boolean),
  data: (r) => year(r) ? [year(r)] : [],
  persone: (r) => r.persone,
  formazione: (r) => r.formazione,
  parole: (r) => r.parole,
  serie: (r) => [r.serie].filter(Boolean),
}

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function search(q, campo) {
  const needle = norm(q)
  const records = allRecords()
  let found
  if (!needle) found = records
  else if (campo && campoValues[campo]) {
    found = records.filter(r => campoValues[campo](r).some(v => norm(v) === needle))
  } else {
    found = records.filter(r => norm([
      r.id, r.titolo, r.autore, r.citta, r.luogo, r.evento, r.data, r.serie,
      ...r.persone, ...r.formazione, ...r.parole,
    ].join(' ')).includes(needle))
  }
  // Prima le schede che hanno già l'immagine online
  return [...found].sort((a, b) => (hasImage(b) ? 1 : 0) - (hasImage(a) ? 1 : 0))
}

// Export con le stesse colonne del catalogo Excel originale.
// Separatore ";" e BOM UTF-8 così Excel in italiano lo apre direttamente.
const exportColumns = [
  ['identificativo', 'id'], ['status', 'status'], ['fondo', 'fondo'], ['serie', 'serie'],
  ['titolo', 'titolo'], ['autore', 'autore'], ['luogo di stampa', 'luogoStampa'], ['data', 'data'],
  ['data per ordinamento', 'dataOrd'], ['città', 'citta'], ['luogo', 'luogo'], ['evento', 'evento'],
  ['formazione politica', 'formazione'], ['persone', 'persone'], ['parole chiave', 'parole'],
  ['sequenza', 'sequenza'], ['tipologia', 'tipologia'], ['supporto', 'supporto'],
  ['dimensioni originale', 'dimensioni'], ['orientamento', 'orientamento'], ['colore', 'colore'],
  ['particolare', 'particolare'], ['fronte retro', 'fronteRetro'], ['pagine', 'pagine'], ['note', 'note'],
  ['file immagini', 'immagini'], ['pdf', 'pdf'],
]

export function exportCSV() {
  const cell = (v) => `"${(Array.isArray(v) ? v.join(' | ') : (v ?? '')).toString().replace(/"/g, '""')}"`
  const records = [...allRecords()].sort((a, b) => a.id.localeCompare(b.id))
  const lines = [
    exportColumns.map(([h]) => cell(h)).join(';'),
    ...records.map(r => exportColumns.map(([, k]) => cell(r[k])).join(';')),
  ]
  return '﻿' + lines.join('\r\n')
}

const titoli = {
  autore: 'Autore',
  luogo: 'Città / Luogo',
  data: 'Data',
  persone: 'Persone',
  formazione: 'Formazione politica',
  parole: 'Parole chiave',
}

export function buildIndex(campo) {
  const key = titoli[campo] ? campo : 'autore'
  const counts = new Map()
  for (const r of allRecords()) {
    for (const v of new Set(campoValues[key](r))) counts.set(v, (counts.get(v) || 0) + 1)
  }
  const items = [...counts].map(([name, count]) => ({ name, count }))
  items.sort(key === 'data'
    ? (a, b) => a.name.localeCompare(b.name)
    : (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'it'))
  return { campo: key, titolo: titoli[key], items }
}

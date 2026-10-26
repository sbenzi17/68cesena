// Unico punto di accesso ai dati del catalogo.
// Oggi legge catalogo.json (generato dall'Excel con scripts/build-catalogo.mjs);
// quando ci sarà il database basterà sostituire queste funzioni con chiamate API.
import catalogo from './catalogo.json'

const BASE = import.meta.env.BASE_URL
const EDITS_KEY = 'archivio-modifiche-demo'

// Modifiche fatte dal pannello admin: in questa demo restano solo nel browser
function loadEdits() {
  try { return JSON.parse(localStorage.getItem(EDITS_KEY)) || {} } catch { return {} }
}

function allRecords() {
  const edits = loadEdits()
  const merged = catalogo.map(r => edits[r.id] ? { ...r, ...edits[r.id] } : r)
  const nuove = Object.values(edits).filter(e => !catalogo.some(r => r.id === e.id))
  return [...nuove, ...merged]
}

export function saveRecord(record) {
  const edits = loadEdits()
  edits[record.id] = record
  try { localStorage.setItem(EDITS_KEY, JSON.stringify(edits)) } catch { /* storage non disponibile */ }
}

export function nextId() {
  const max = Math.max(...allRecords().map(r => parseInt(r.id, 10) || 0))
  return String(max + 1).padStart(3, '0')
}

export function imageUrl(record, size = 'thumbs') {
  if (record.imgData) return record.imgData
  return record.img ? `${BASE}foto/${size}/${record.id}.jpg` : null
}

function shortPlace(r) {
  return [r.citta, r.data].filter(Boolean).join(', ')
}

// Forma usata da Thumb e Lightbox
export function toThumb(r) {
  return {
    id: r.id,
    bg: `bg-${(parseInt(r.id, 10) % 8) + 1}`,
    label: r.img || r.imgData ? '' : 'Immagine in digitalizzazione',
    caption: [r.titolo, shortPlace(r)].filter(Boolean).join(' · '),
    src: imageUrl(r),
    large: imageUrl(r, 'large'),
  }
}

export const totalCount = catalogo.length

export function getRecords() {
  return allRecords()
}

export function getPhotoDetail(id) {
  return allRecords().find(r => r.id === id) || null
}

export function recentPhotos() {
  return allRecords().filter(r => r.img || r.imgData).slice(0, 12).map(toThumb)
}

export function featuredPhotos(n = 3) {
  return allRecords().filter(r => r.img && r.serie === 'Fotografie').filter((_, i) => i % 7 === 0).slice(0, n)
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
  return [...found].sort((a, b) => (b.img ? 1 : 0) - (a.img ? 1 : 0))
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

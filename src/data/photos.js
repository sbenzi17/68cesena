// Unico punto di accesso ai dati del catalogo.
// Con Supabase configurato (.env.production) legge e scrive sul database e le immagini stanno su R2;
// altrimenti usa catalogo.json e salva le modifiche solo nel browser (modalità demo).
// Il catalogo viene caricato tutto all'avvio (loadCatalogo) e poi filtrato in memoria.
import { supabase, hasBackend, IMG_BASE, uploadFile } from '../lib/supabase'

// pdf-lib si scarica solo quando serve rigenerare un PDF
const PDF_LIB = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm'

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
  createdAt: r.created_at,
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

// Nomi sempre nuovi per i file caricati: le versioni precedenti restano su R2 e lo storico può ripristinarle
const uniqueName = (id) => `${id}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

// PDF con una pagina per immagine, nell'ordine dato: larghezza A4, altezza proporzionale
// (come scripts/bollettini-pdf.mjs)
export async function pdfFromImages(files) {
  const { PDFDocument } = await import(/* @vite-ignore */ PDF_LIB)
  const doc = await PDFDocument.create()
  for (const file of files) {
    const jpg = await resizeImage(file, 2000, 0.85)
    const img = await doc.embedJpg(await jpg.arrayBuffer())
    const width = 595.28
    const height = width * img.height / img.width
    doc.addPage([width, height]).drawImage(img, { x: 0, y: 0, width, height })
  }
  return new Blob([await doc.save()], { type: 'application/pdf' })
}

// Niente upsert: il trigger dello storico registrerebbe anche una creazione fittizia a ogni modifica
function writeRow(row, exists) {
  const query = exists
    ? supabase.from('schede').update(row).eq('id', row.id)
    : supabase.from('schede').insert(row)
  return query.select().single()
}

// Salva una scheda. `pages` (facoltativo) è l'elenco ordinato delle immagini:
// { name } per un'immagine già online, { file } per una nuova da caricare.
// `pdf` (facoltativo) è il nuovo PDF del documento completo (Blob), oppure null per toglierlo.
export async function saveRecord(record, pages, pdf) {
  const r = { ...record }
  if (hasBackend) {
    if (pages) {
      const names = []
      for (const p of pages) {
        if (!p.file) { names.push(p.name); continue }
        const name = uniqueName(r.id)
        await uploadFile(`thumbs/${name}.jpg`, await resizeImage(p.file, 600, 0.75))
        await uploadFile(`large/${name}.jpg`, await resizeImage(p.file, 1600, 0.82))
        names.push(name)
      }
      r.immagini = names
    }
    if (pdf) {
      r.pdf = `${uniqueName(r.id)}.pdf`
      await uploadFile(`pdf/${r.pdf}`, pdf)
    } else if (pdf === null) {
      r.pdf = null
    }
    const { data, error } = await writeRow(toDb(r), Boolean(getPhotoDetail(r.id)))
    if (error) throw error
    Object.assign(r, fromDb(data))
  } else {
    const file = pages?.find(p => p.file)?.file
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

// Le immagini restano su R2, così dallo storico si può ripristinare la scheda eliminata
export async function deleteRecord(id) {
  if (!getPhotoDetail(id)) return
  if (hasBackend) {
    const { error } = await supabase.from('schede').delete().eq('id', id)
    if (error) throw error
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

// Ultime aggiunte: per data di inserimento nel database, a parità per identificativo più alto
const byAdded = (a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') || b.id.localeCompare(a.id)

// Per la home: niente volantini
export function recentPhotos() {
  return allRecords().filter(r => hasImage(r) && r.serie !== 'Volantini').sort(byAdded).slice(0, 12).map(toThumb)
}

// Fotografie scelte a caso (cambiano a ogni caricamento della pagina), per il banner della home
export function randomPhotos(n = 5) {
  const pool = allRecords().filter(r => hasImage(r) && r.serie === 'Fotografie')
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, n)
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

// Radice di una parola: senza la vocale finale, così singolare e plurale coincidono
// (bollettino/bollettini, manifestazione/manifestazioni, studente/studenti)
const stem = (w) => w.length >= 4 ? w.replace(/[aeiou]$/, '') : w
const words = (s) => norm(s).split(/[^a-z0-9?]+/).filter(Boolean)

// Testo in cui cerca la ricerca libera, preparato una volta per scheda
const haystacks = new WeakMap()
function haystack(r) {
  if (!haystacks.has(r)) {
    haystacks.set(r, ` ${words([
      r.id, r.titolo, r.autore, r.citta, r.luogo, r.luogoStampa, r.evento, r.data, r.serie,
      r.tipologia, r.supporto, r.note, ...r.persone, ...r.formazione, ...r.parole,
    ].join(' ')).join(' ')}`)
  }
  return haystacks.get(r)
}

export function search(q, campo) {
  const needle = norm(q)
  const records = allRecords()
  let found
  if (!needle) found = records
  else if (campo && campoValues[campo]) {
    found = records.filter(r => campoValues[campo](r).some(v => norm(v) === needle))
  } else {
    // ogni parola cercata deve comparire (in qualsiasi ordine) come inizio di una parola della scheda
    const terms = words(q).map(w => ` ${stem(w)}`)
    found = records.filter(r => terms.every(t => haystack(r).includes(t)))
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

// Valori già usati in un campo, per i suggerimenti del modulo admin
export function distinctValues(key) {
  const values = new Set()
  for (const r of allRecords()) for (const v of [].concat(r[key] ?? [])) if (v) values.add(v)
  return [...values].sort((a, b) => a.localeCompare(b, 'it'))
}

// Storico delle modifiche, scritto dal database a ogni salvataggio (solo con Supabase)
export async function loadStorico({ schedaId, from = 0, size = 50 } = {}) {
  let query = supabase.from('schede_storico').select('*').order('id', { ascending: false }).range(from, from + size - 1)
  if (schedaId) query = query.eq('scheda_id', schedaId)
  const { data, error } = await query
  if (error) throw error
  return data
}

// Riporta la scheda com'era prima della modifica: una creazione si annulla eliminando, un'eliminazione ricreando
export async function restoreStorico(entry) {
  if (entry.azione === 'INSERT') {
    const { error } = await supabase.from('schede').delete().eq('id', entry.scheda_id)
    if (error) throw error
  } else {
    const { updated_at, ...row } = entry.prima
    const { error } = await writeRow(row, Boolean(getPhotoDetail(entry.scheda_id)))
    if (error) throw error
  }
  await loadCatalogo()
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

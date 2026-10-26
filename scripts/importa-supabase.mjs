// Importa il catalogo (src/data/catalogo.json) nella tabella `schede` di Supabase,
// associando a ogni scheda i suoi file immagine e l'eventuale PDF.
// Da usare una volta sola: dopo l'importazione il database è il master e si modifica dall'admin.
// Uso: node scripts/importa-supabase.mjs <cartella originali> [cartella pdf]
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { parse } from 'node:path'
import { loadEnv } from './env.mjs'

const env = loadEnv()
const [imgDir, pdfDir] = process.argv.slice(2)
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const catalogo = JSON.parse(readFileSync('src/data/catalogo.json', 'utf8'))
const files = readdirSync(imgDir).filter(f => /\.jpe?g$/i.test(f)).map(f => parse(f).name).sort()
const pdfs = pdfDir && existsSync(pdfDir) ? readdirSync(pdfDir) : []

const rows = catalogo.map(r => {
  const own = files.filter(n => n === r.id || n.startsWith(`${r.id}-`))
  // la pagina "ID" senza trattino (se c'è) viene prima delle pagine ID-001, ID-002...
  own.sort((a, b) => (a === r.id ? -1 : b === r.id ? 1 : a.localeCompare(b)))
  return {
    id: r.id,
    status: r.status || 'ok',
    fondo: r.fondo, serie: r.serie, titolo: r.titolo, autore: r.autore,
    luogo_stampa: r.luogoStampa, data: r.data, data_ord: r.dataOrd,
    citta: r.citta, luogo: r.luogo, evento: r.evento,
    formazione: r.formazione, persone: r.persone, parole: r.parole,
    sequenza: r.sequenza, tipologia: r.tipologia, supporto: r.supporto,
    dimensioni: r.dimensioni, orientamento: r.orientamento, colore: r.colore,
    particolare: r.particolare, fronte_retro: r.fronteRetro, pagine: r.pagine,
    note: r.note || null,
    immagini: own,
    pdf: pdfs.includes(`${r.id}.pdf`) ? `${r.id}.pdf` : null,
  }
})

for (let i = 0; i < rows.length; i += 200) {
  const { error } = await supabase.from('schede').upsert(rows.slice(i, i + 200))
  if (error) throw error
}
console.log(`${rows.length} schede importate, ${rows.filter(r => r.immagini.length).length} con immagini, ${rows.filter(r => r.pdf).length} con PDF`)

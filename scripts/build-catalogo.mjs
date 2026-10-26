// Converte l'export CSV del catalogo (FileMaker/Excel) nel JSON usato dal sito.
// Uso: node scripts/build-catalogo.mjs <catalogo.csv> <cartella immagini web>
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const [csvPath, imgDir] = process.argv.slice(2)

function parseCSV(text) {
  const rows = []
  let row = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = '' }
    else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

// I campi multipli dell'export sono separati dal carattere 0x1D, scritto come _x001d_
const list = (v) => (v || '').split('_x001d_').map(s => s.trim()).filter(Boolean)
const text = (v) => (v || '').replace(/_x001d_/g, ' ').trim()
const num = (v) => text(v).replace(/\.0$/, '')

const [header, ...rows] = parseCSV(readFileSync(csvPath, 'utf8'))
const col = (name) => header.indexOf(name)
const get = (r, name) => r[col(name)]

const records = rows
  .filter(r => text(get(r, 'identificativo')))
  .map(r => {
    const id = text(get(r, 'identificativo'))
    return {
      id,
      status: text(get(r, 'status')),
      fondo: text(get(r, 'Fondo Maurizio Benzi')),
      serie: text(get(r, 'serie')),
      titolo: text(get(r, 'titolo')),
      autore: text(get(r, 'autore')),
      luogoStampa: text(get(r, 'luogo di stampa')),
      data: text(get(r, 'data')),
      dataOrd: text(get(r, 'data per ordinamento')),
      citta: text(get(r, 'città')),
      luogo: text(get(r, 'luogo')),
      evento: text(get(r, 'evento')),
      formazione: list(get(r, 'formazione politica')),
      persone: list(get(r, 'persone')),
      parole: list(get(r, 'parole chiave')),
      sequenza: num(get(r, 'sequenza')),
      tipologia: text(get(r, 'tipologia')),
      supporto: text(get(r, 'supporto')),
      dimensioni: text(get(r, 'dimensioni originale')),
      orientamento: text(get(r, 'orientamento')),
      colore: text(get(r, 'colore')),
      particolare: text(get(r, 'particolare')),
      fronteRetro: text(get(r, 'fronte retro')),
      pagine: num(get(r, 'pagine')),
      img: existsSync(join(imgDir, 'thumbs', `${id}.jpg`)),
    }
  })

writeFileSync('src/data/catalogo.json', JSON.stringify(records))
console.log(`${records.length} schede, ${records.filter(r => r.img).length} con immagine`)

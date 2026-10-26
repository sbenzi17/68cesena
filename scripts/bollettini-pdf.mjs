// Crea un PDF per ogni scheda della serie "Bollettini" unendo le pagine ID-001, ID-002, ...
// Legge soltanto: originali e catalogo non vengono modificati.
// Uso: node scripts/bollettini-pdf.mjs <cartella originali> <cartella output>
import { PDFDocument } from 'pdf-lib'
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, parse } from 'node:path'

const [src, out] = process.argv.slice(2)
mkdirSync(out, { recursive: true })

const catalogo = JSON.parse(readFileSync('src/data/catalogo.json', 'utf8'))
const files = readdirSync(src).filter(f => /\.jpe?g$/i.test(f)).map(f => parse(f).name)

const A4_WIDTH = 595.28 // larghezza pagina in punti; l'altezza segue le proporzioni della scansione

for (const r of catalogo.filter(r => r.serie === 'Bollettini')) {
  const pages = files.filter(n => n.startsWith(`${r.id}-`)).sort()
  const doc = await PDFDocument.create()
  doc.setTitle(r.titolo)
  for (const p of pages) {
    const img = await doc.embedJpg(readFileSync(join(src, `${p}.jpg`)))
    const h = A4_WIDTH * img.height / img.width
    doc.addPage([A4_WIDTH, h]).drawImage(img, { x: 0, y: 0, width: A4_WIDTH, height: h })
  }
  writeFileSync(join(out, `${r.id}.pdf`), await doc.save())
  const attese = parseInt(r.pagine, 10)
  console.log(`${r.id}.pdf: ${pages.length} pagine${attese !== pages.length ? `  ATTENZIONE: il catalogo dice ${attese}` : ''}`)
}

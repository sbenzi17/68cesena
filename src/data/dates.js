// "Data per ordinamento": nel database resta aaaa.mm.gg (o aaaa.mm / aaaa) perché si ordina come testo,
// seguita dalla precisione (a = ante, p = post, ? = circa) e dall'eventuale fine intervallo " - aaaa.mm.gg".
// Nel pannello si scrive e si legge come gg/mm/aaaa, mm/aaaa o aaaa. Un anno come "197?" indica la cifra ignota.

export const precisioni = [
  ['', 'esatta'],
  ['?', 'circa (?)'],
  ['a', 'prima del (ante)'],
  ['p', 'dopo il (post)'],
]

const DATE = String.raw`\d{3}[\d?](?:\.\d{2}){0,2}`
const ORD_RE = new RegExp(`^(${DATE})([ap?]?)(?: - (${DATE}))?$`)

// Pattern HTML per i campi del modulo
export const IT_PATTERN = String.raw`(\d{1,2}/){0,2}\d{3}[\d?]`

const ordToIt = (s) => (s || '').split('.').reverse().join('/')

// "1972.10.01p" -> { data: '01/10/1972', precisione: 'p', fine: '' }; i valori fuori formato restano in `data`
export function splitOrd(value) {
  const m = (value || '').match(ORD_RE)
  if (!m) return { data: value || '', precisione: '', fine: '' }
  return { data: ordToIt(m[1]), precisione: m[2], fine: ordToIt(m[3]) }
}

// "1/3/1977" -> "1977.03.01"; '' se vuota, null se non valida
export function itToOrd(text) {
  const t = (text || '').trim()
  if (!t) return ''
  const parts = t.split('/')
  if (parts.length > 3 || parts.some(p => !p)) return null
  const [y, m, d] = parts.reverse()
  if (!/^\d{3}[\d?]$/.test(y)) return null
  if (m !== undefined && !(/^\d{1,2}$/.test(m) && +m >= 1 && +m <= 12)) return null
  if (d !== undefined) {
    const max = y.includes('?') ? 31 : new Date(+y, +m, 0).getDate()
    if (!/^\d{1,2}$/.test(d) || +d < 1 || +d > max) return null
  }
  return [y, m, d].filter(Boolean).map((p, i) => i ? p.padStart(2, '0') : p).join('.')
}

// Compone il valore da salvare; restituisce { value } oppure { error }
export function joinOrd(data, precisione, fine) {
  const start = itToOrd(data)
  const end = itToOrd(fine)
  const formato = 'scrivi gg/mm/aaaa, mm/aaaa oppure aaaa'
  if (start === null) return { error: `Data per ordinamento non valida: ${formato}.` }
  if (end === null) return { error: `Data «fino al» non valida: ${formato}.` }
  if (!start && (end || precisione)) return { error: 'Manca la data per ordinamento.' }
  if (end && end < start) return { error: 'La data «fino al» è precedente alla data di inizio.' }
  return { value: start ? `${start}${precisione}${end ? ` - ${end}` : ''}` : '' }
}

// Testo leggibile per elenchi: "dopo il 01/10/1972", "12/1975 – 01/1976"
export function formatOrd(value) {
  const { data, precisione, fine } = splitOrd(value)
  const prefix = { '?': 'circa ', a: 'prima del ', p: 'dopo il ' }[precisione] || ''
  return `${prefix}${data}${fine ? ` – ${fine}` : ''}`
}

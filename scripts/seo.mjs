// Dopo la build (npm run build lo lancia da solo): prepara il sito per i motori di ricerca.
// - una pagina HTML vera per ogni scheda pubblicata (dist/foto/<id>/index.html) con titolo, descrizione,
//   immagine e dati strutturati: così Google la riceve con risposta 200 invece del 404 dell'app a pagina unica
// - pagine statiche per risultati, indici, contatti e collabora
// - sitemap.xml (da segnalare in Google Search Console) e robots.txt
// Legge le schede pubblicate con la chiave pubblica (anon) indicata in .env.production.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { loadEnv } from './env.mjs'

const env = loadEnv('.env.production')
const SITE = (env.VITE_SITE_URL || '').replace(/\/$/, '')
const IMG = (env.VITE_IMG_BASE || '').replace(/\/$/, '')
if (!SITE || !env.VITE_SUPABASE_URL) {
  console.log('seo: VITE_SITE_URL o VITE_SUPABASE_URL mancanti in .env.production, salto')
  process.exit(0)
}

const SITO = '1968/1977 a Cesena'
const DESCRIZIONE = 'Archivio fotografico e documentale sui movimenti politici e le lotte studentesche a Cesena dal 1968 al 1977: fotografie, volantini, bollettini e manifesti.'
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const jsonld = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

// Schede pubblicate (le sospese non sono visibili con la chiave pubblica)
const schede = []
for (let from = 0; ; from += 1000) {
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/schede?select=id,titolo,serie,autore,data,data_ord,citta,luogo,persone,parole,immagini,video,updated_at&order=id&offset=${from}&limit=1000`, {
    headers: { apikey: env.VITE_SUPABASE_ANON_KEY },
  })
  if (!res.ok) throw new Error(`seo: lettura delle schede non riuscita (${res.status})`)
  const page = await res.json()
  schede.push(...page)
  if (page.length < 1000) break
}

const template = readFileSync('dist/index.html', 'utf8')

function scrivi(path, { title, description, image, data, h1, extra = '' }) {
  const url = `${SITE}/${path}`
  const head = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    image && `<meta property="og:image" content="${esc(image)}" />`,
    data && jsonld(data),
  ].filter(Boolean).join('\n    ')
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace('</head>', `    ${head}\n  </head>`)
    // testo leggibile anche prima che parta l'app (lo sostituisce subito)
    .replace('<div id="root"></div>', `<div id="root"><main><h1>${esc(h1)}</h1><p>${esc(description)}</p>${extra}</main></div>`)
  const dir = join('dist', path)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
}

// "1977.03.08p" -> "1977-03-08" (solo date complete e certe)
const isoDate = (d) => /^\d{4}\.\d{2}\.\d{2}$/.test(d || '') ? d.replace(/\./g, '-') : /^\d{4}$/.test(d || '') ? d : undefined
const youtubeThumb = (url) => (url || '').match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/)?.[1]

// Home
writeFileSync('dist/index.html', template.replace('</head>', `    <link rel="canonical" href="${SITE}/" />
    <meta property="og:url" content="${SITE}/" />
    ${jsonld({ '@context': 'https://schema.org', '@type': 'WebSite', name: SITO, url: `${SITE}/`, inLanguage: 'it', description: DESCRIZIONE })}
  </head>`))

// Schede
for (const r of schede) {
  const autore = r.autore && r.autore !== 'Sconosciuto' ? r.autore : null
  const description = [
    [r.serie, [r.citta, r.data].filter(Boolean).join(', ')].filter(Boolean).join(' — '),
    autore && `Autore: ${autore}`,
    r.persone?.length && `Persone: ${r.persone.join(', ')}`,
    r.parole?.length && `Parole chiave: ${r.parole.join(', ')}`,
  ].filter(Boolean).join('. ') || r.titolo
  const yt = youtubeThumb(r.video)
  const image = r.immagini?.[0] ? `${IMG}/large/${r.immagini[0]}.jpg` : yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : undefined
  scrivi(`foto/${r.id}/`, {
    title: `${r.titolo} — ${SITO}`,
    description: description.slice(0, 300),
    image,
    h1: r.titolo,
    data: {
      '@context': 'https://schema.org',
      '@type': r.serie === 'Fotografie' ? 'Photograph' : 'CreativeWork',
      name: r.titolo,
      description,
      url: `${SITE}/foto/${r.id}/`,
      ...(image && { image }),
      ...(isoDate(r.data_ord) && { dateCreated: isoDate(r.data_ord) }),
      ...(autore && { creator: { '@type': r.serie === 'Fotografie' ? 'Person' : 'Organization', name: autore } }),
      ...((r.luogo || r.citta) && { contentLocation: { '@type': 'Place', name: [r.luogo, r.citta].filter(Boolean).join(', ') } }),
      ...(r.parole?.length && { keywords: r.parole.join(', ') }),
      inLanguage: 'it',
      isPartOf: { '@type': 'WebSite', name: SITO, url: `${SITE}/` },
    },
  })
}

// Pagine fisse
const fisse = [
  ['risultati/', "Tutto l'archivio", `${schede.length} documenti: fotografie, volantini, bollettini e manifesti su Cesena dal 1968 al 1977.`],
  ['indice/', 'Indici', "Indici dell'archivio per autore, luogo, data, persone, formazione politica, parole chiave e formato."],
  ['contatto/', 'Contattaci', "Scrivi all'archivio 1968/1977 a Cesena: domande, correzioni, ricordi da segnalare."],
  ['collabora/', 'Collabora', "Hai fotografie o documenti sui movimenti politici e le lotte studentesche a Cesena tra il 1968 e il 1977? Donali all'archivio."],
]
for (const [path, titolo, description] of fisse) scrivi(path, { title: `${titolo} — ${SITO}`, description, h1: titolo })

// Sitemap e robots.txt
const indici = ['autore', 'luogo', 'data', 'persone', 'formazione', 'parole', 'formato']
const urls = [
  `<url><loc>${SITE}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
  ...fisse.map(([p]) => `<url><loc>${SITE}/${p}</loc></url>`),
  ...indici.map(c => `<url><loc>${SITE}/indice/?campo=${c}</loc></url>`),
  ...schede.map(r => `<url><loc>${SITE}/foto/${r.id}/</loc>${r.updated_at ? `<lastmod>${r.updated_at.slice(0, 10)}</lastmod>` : ''}</url>`),
]
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`)
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\nSitemap: ${SITE}/sitemap.xml\n`)

console.log(`seo: ${schede.length} pagine di schede, ${fisse.length} pagine fisse, sitemap con ${urls.length} indirizzi`)

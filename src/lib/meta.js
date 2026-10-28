// Titolo e descrizione della pagina (quelli che Google mostra nei risultati) e indicazione per i motori di ricerca
import { useEffect } from 'react'

export const SITO = '1968/1977 a Cesena'
const DESCRIZIONE = 'Archivio fotografico e documentale sui movimenti politici e le lotte studentesche a Cesena dal 1968 al 1977: fotografie, volantini, bollettini e manifesti.'

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function usePageMeta(titolo, descrizione, { noindex = false } = {}) {
  useEffect(() => {
    const title = titolo ? `${titolo} — ${SITO}` : `${SITO} — Archivio fotografico e documenti`
    const description = (descrizione || DESCRIZIONE).slice(0, 300)
    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
  }, [titolo, descrizione, noindex])
}

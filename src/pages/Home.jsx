import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Banner from '../components/Banner'
import Thumb from '../components/Thumb'
import Lightbox from '../components/Lightbox'
import { useLightbox } from '../components/Lightbox'
import { recentPhotos, featuredPhotos, imageUrl, getRecords } from '../data/photos'

export default function Home() {
  const navigate = useNavigate()
  const photos = useMemo(() => recentPhotos(), [])
  const total = useMemo(() => getRecords().length, [])
  const lb = useLightbox(photos)

  const slides = useMemo(() => {
    const [a, b, c] = featuredPhotos(3)
    return [
      { image: imageUrl(a, 'large'), eyebrow: 'Nuovo fondo', title: 'Fondo Maurizio Benzi',
        description: 'Fotografie, volantini e manifesti · Cesena 1968–1977', cta: 'Sfoglia il fondo',
        href: `/risultati?q=${encodeURIComponent('Fondo Maurizio Benzi')}` },
      { image: imageUrl(b, 'large'), eyebrow: 'In evidenza', title: b?.titolo,
        description: [b?.citta, b?.data].filter(Boolean).join(' — '), cta: 'Vedi la fotografia',
        href: `/foto/${b?.id}` },
      { image: imageUrl(c, 'large'), eyebrow: 'Percorso', title: 'Le manifestazioni',
        description: 'Cortei, scioperi e assemblee negli anni Settanta', cta: 'Esplora',
        href: `/risultati?q=manifestazione` },
    ].filter(s => s.image)
  }, [])

  const onSubmit = (e) => {
    e.preventDefault()
    const q = new FormData(e.currentTarget).get('q') || ''
    navigate(`/risultati?q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <Banner slides={slides} />

      <section className="hero">
        <div className="container">
          <h1><em>{total}</em> documenti storici</h1>
          <p>Cerca per autore, luogo, persona, evento o parola chiave</p>
          <form className="searchbox" onSubmit={onSubmit}>
            <input type="text" name="q" placeholder="Cerca nell'archivio…" />
            <button type="submit">Cerca</button>
          </form>
        </div>
      </section>

      <main className="container">
        <h2 className="section-title">
          Aggiunte recenti
          <span className="count">{total} totali</span>
        </h2>

        <div className="grid">
          {photos.map((p) => (
            <Thumb key={p.id} photo={p} onClick={lb.open} />
          ))}
        </div>
      </main>

      <Lightbox
        photos={photos}
        index={lb.index}
        onClose={lb.close}
        onPrev={lb.prev}
        onNext={lb.next}
      />
    </>
  )
}

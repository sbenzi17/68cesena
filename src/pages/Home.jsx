import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Banner from '../components/Banner'
import Thumb from '../components/Thumb'
import Lightbox from '../components/Lightbox'
import { useLightbox } from '../components/Lightbox'
import { recentPhotos, latestUploads, imageUrl, getRecords } from '../data/photos'

export default function Home() {
  const navigate = useNavigate()
  const photos = useMemo(() => recentPhotos(), [])
  const total = useMemo(() => getRecords().length, [])
  const lb = useLightbox(photos)

  const slides = useMemo(() => latestUploads(5).map(r => ({
    image: imageUrl(r, 'large'),
    title: r.titolo,
    description: [r.citta, r.data].filter(Boolean).join(' — '),
    href: `/foto/${r.id}`,
  })), [])

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

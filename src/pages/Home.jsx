import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Banner from '../components/Banner'
import Thumb from '../components/Thumb'
import Lightbox from '../components/Lightbox'
import { useLightbox } from '../components/Lightbox'
import { usePageMeta } from '../lib/meta'
import { recentPhotos, randomUploads, imageUrl, videoInfo, getRecords, getEvento, eventoVisibile, eventoImageUrl, eventoPeriodo, getTestoHome } from '../data/photos'

// Sezione informativa dell'evento in evidenza (sotto il banner, solo se l'admin l'ha attivata)
function Evento({ evento }) {
  const img = eventoImageUrl(evento)
  return (
    <section id="evento" className="evento">
      <div className={`container evento-inner${img ? '' : ' evento-noimg'}`}>
        {img && <img src={img} alt="" className="evento-img" />}
        <div>
          <span className="evento-eyebrow">In evidenza</span>
          <h2>{evento.titolo}</h2>
          {eventoPeriodo(evento) && <p className="evento-periodo">{eventoPeriodo(evento)}</p>}
          {evento.testo && <div className="evento-testo">{evento.testo}</div>}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  usePageMeta(null)
  const navigate = useNavigate()
  const photos = useMemo(() => recentPhotos(), [])
  const total = useMemo(() => getRecords().length, [])
  const lb = useLightbox(photos)

  const evento = eventoVisibile() ? getEvento() : null
  const testoHome = getTestoHome()

  // se c'è un evento attivo con immagine, è sempre la prima slide; cliccandola si scende alla sua sezione.
  // Le altre slide sono schede a caso: cambiano ad ogni caricamento della pagina.
  const slides = useMemo(() => [
    ...(evento && eventoImageUrl(evento) ? [{
      image: eventoImageUrl(evento),
      eyebrow: 'In evidenza',
      title: evento.titolo,
      description: eventoPeriodo(evento),
      onClick: () => document.getElementById('evento')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    }] : []),
    // il banner ha bisogno di un'immagine: i file video senza immagine restano fuori
    ...randomUploads(12).map(r => ({
      image: imageUrl(r, 'large') || videoInfo(r.video)?.thumb,
      title: r.titolo,
      description: [r.citta, r.data].filter(Boolean).join(' — '),
      href: `/foto/${r.id}`,
    })).filter(s => s.image).slice(0, 5),
  ], [evento])

  const onSubmit = (e) => {
    e.preventDefault()
    const q = new FormData(e.currentTarget).get('q') || ''
    navigate(`/risultati?q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <Banner slides={slides} />
      {testoHome && (
        <section className="evento">
          <div className="container evento-inner evento-noimg">
            <div><div className="evento-testo">{testoHome}</div></div>
          </div>
        </section>
      )}
      {evento && <Evento evento={evento} />}

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

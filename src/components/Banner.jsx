import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const defaultSlides = [
  {
    bg: 'bg-1',
    eyebrow: 'In evidenza',
    title: 'La Liberazione di Forlì',
    description: '9 novembre 1944 — una raccolta di immagini inedite',
    cta: 'Esplora la raccolta',
    href: '/risultati',
  },
  {
    bg: 'bg-3',
    eyebrow: 'Nuovo fondo',
    title: "Archivio Dell'Amore",
    description: '47 fotografie dal 1948 al 1962',
    cta: 'Sfoglia il fondo',
    href: '/risultati',
  },
  {
    bg: 'bg-7',
    eyebrow: 'Mostra online',
    title: 'Vita di paese nel dopoguerra',
    description: 'Cesena, Forlimpopoli, Bertinoro — 1945-1955',
    cta: 'Vai alla mostra',
    href: '/risultati',
  },
]

export default function Banner({ slides = defaultSlides }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }

  const start = () => {
    stop()
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length)
    }, 5000)
  }

  useEffect(() => {
    start()
    return stop
  }, [slides.length])

  const goTo = (i) => { setCurrent(((i % slides.length) + slides.length) % slides.length); start() }

  if (slides.length === 0) return null

  return (
    <section className="banner" onMouseEnter={stop} onMouseLeave={start}>
      {slides.map((s, i) => (
        <div
          key={i}
          className={`banner-slide ${s.bg || 'bg-1'}${s.image ? ' has-img' : ''}${i === current ? ' active' : ''}`}
          style={s.image ? { backgroundImage: `url(${s.image})` } : undefined}
        >
          <div className="banner-content">
            <span className="banner-eyebrow">{s.eyebrow}</span>
            <h2>{s.title}</h2>
            <p>{s.description}</p>
            <Link to={s.href} className="banner-btn">{s.cta}</Link>
          </div>
        </div>
      ))}

      <button className="banner-arrow banner-prev" aria-label="Precedente" onClick={() => goTo(current - 1)}>&larr;</button>
      <button className="banner-arrow banner-next" aria-label="Successivo" onClick={() => goTo(current + 1)}>&rarr;</button>

      <div className="banner-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`banner-dot${i === current ? ' active' : ''}`}
            aria-label={`Slide ${i + 1}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </section>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// Le slide scorrono da sole ogni 5 secondi (si fermano mentre il mouse è sopra il banner)
export default function Banner({ slides }) {
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
      {slides.map((s, i) => {
        // una slide porta a una scheda (href) oppure esegue un'azione (onClick, es. scorrere all'evento)
        const props = {
          key: s.href || s.title,
          className: `banner-slide has-img${i === current ? ' active' : ''}`,
          style: { backgroundImage: `url(${s.image})` },
          tabIndex: i === current ? 0 : -1,
        }
        const content = (
          <div className="banner-content">
            {s.eyebrow && <span className="banner-eyebrow">{s.eyebrow}</span>}
            <h2>{s.title}</h2>
            <p>{s.description}</p>
          </div>
        )
        return s.href
          ? <Link to={s.href} {...props}>{content}</Link>
          : <a href="#evento" {...props} onClick={(e) => { e.preventDefault(); s.onClick?.() }}>{content}</a>
      })}

      <button className="banner-arrow banner-prev" aria-label="Foto precedente" onClick={() => goTo(current - 1)}>&#8249;</button>
      <button className="banner-arrow banner-next" aria-label="Foto successiva" onClick={() => goTo(current + 1)}>&#8250;</button>

      <div className="banner-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`banner-dot${i === current ? ' active' : ''}`}
            aria-label={`Foto ${i + 1}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </section>
  )
}

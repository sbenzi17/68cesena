import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { VideoEmbed } from './Media'

export default function Lightbox({ photos, index, onClose, onPrev, onNext, link = true }) {
  const closeRef = useRef(null)
  const isOpen = index != null

  // all'apertura la tastiera va sul pulsante Chiudi; alla chiusura torna dove si era
  useEffect(() => {
    if (!isOpen) return
    const prima = document.activeElement
    closeRef.current?.focus()
    return () => prima?.focus?.({ preventScroll: true })
  }, [isOpen])

  useEffect(() => {
    if (index == null) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [index, onClose, onPrev, onNext])

  if (index == null) return null
  const photo = photos[index]
  if (!photo) return null

  return (
    <div
      className="lightbox open"
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption || 'Ingrandimento'}
      onClick={(e) => { if (e.target.classList.contains('lightbox')) onClose() }}
    >
      <button className="lightbox-prev" aria-label="Precedente" onClick={onPrev}>&larr;</button>
      <div className={`lightbox-img thumb-img ${photo.bg}${photo.large || photo.video ? ' has-img' : ''}${photo.video ? ' lightbox-video' : ''}`} data-label={photo.label}>
        {photo.video ? (
          // video: parte subito; chiudendo l'ingrandimento si ferma
          <VideoEmbed key={photo.id} info={photo.video} title={photo.caption} autoplay />
        ) : photo.large && <img src={photo.large} alt={photo.caption} />}
        <div className="lightbox-caption">
          {photo.caption}
          {link && <> · <Link to={`/foto/${photo.id}`} onClick={onClose}>scheda completa</Link></>}
        </div>
      </div>
      <button className="lightbox-next" aria-label="Successivo" onClick={onNext}>&rarr;</button>
      <button ref={closeRef} className="lightbox-close" aria-label="Chiudi" onClick={onClose}>&times;</button>
    </div>
  )
}

export function useLightbox(photos) {
  const [index, setIndex] = useState(null)
  return {
    open: (photo) => setIndex(photos.findIndex(p => p.id === photo.id)),
    close: () => setIndex(null),
    prev: () => setIndex(i => (i - 1 + photos.length) % photos.length),
    next: () => setIndex(i => (i + 1) % photos.length),
    index,
  }
}

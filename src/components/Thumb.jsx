import { Link } from 'react-router-dom'

// L'immagine apre l'ingrandimento (se c'è onClick), il titolo apre la scheda con tutti i dettagli
export default function Thumb({ photo, onClick }) {
  return (
    <div className="thumb">
      <Link
        to={`/foto/${photo.id}`}
        className="thumb-img-link"
        onClick={(e) => {
          if (onClick && photo.src) {
            e.preventDefault()
            onClick(photo)
          }
        }}
      >
        <div className={`thumb-img ${photo.bg}${photo.src ? ' has-img' : ''}`} data-label={photo.label}>
          {photo.src && <img src={photo.src} alt={photo.caption} loading="lazy" />}
        </div>
      </Link>
      <Link to={`/foto/${photo.id}`} className="thumb-caption">
        {photo.caption} <span className="thumb-more">…dettagli</span>
      </Link>
    </div>
  )
}

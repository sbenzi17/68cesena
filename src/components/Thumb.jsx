import { Link } from 'react-router-dom'

// Etichette dei formati mostrate sulle miniature (le immagini non hanno etichetta)
const etichette = { PDF: 'PDF', Video: '▶ Video', Audio: '♪ Audio' }

// L'immagine apre l'ingrandimento (se c'è onClick), il titolo apre la scheda con tutti i dettagli
export default function Thumb({ photo, onClick }) {
  return (
    <div className="thumb">
      <Link
        to={`/foto/${photo.id}`}
        className="thumb-img-link"
        onClick={(e) => {
          if (onClick && (photo.src || photo.video)) {
            e.preventDefault()
            onClick(photo)
          }
        }}
      >
        <div className={`thumb-img ${photo.bg}${photo.src || photo.video ? ' has-img' : ''}`} data-label={photo.label}>
          {photo.src ? (
            <img src={photo.src} alt={photo.caption} loading="lazy" />
          ) : photo.video?.tipo === 'file' && (
            // file video senza immagine: come miniatura un fotogramma a un secondo dall'inizio
            <video src={`${photo.video.src}#t=1`} muted preload="metadata" playsInline aria-label={photo.caption} />
          )}
          {photo.formati?.length > 0 && (
            <span className="thumb-formati">
              {photo.formati.map(f => <span key={f} className="thumb-formato">{etichette[f]}</span>)}
            </span>
          )}
        </div>
      </Link>
      <Link to={`/foto/${photo.id}`} className="thumb-caption">
        {photo.caption} <span className="thumb-more">…dettagli</span>
      </Link>
    </div>
  )
}

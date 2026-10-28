import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPhotoDetail, imageUrl, pdfUrl, audioUrl, formati } from '../data/photos'
import HoverZoom from '../components/HoverZoom'
import { VideoEmbed, AudioPlayer } from '../components/Media'

function Field({ label, children }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  )
}

function Tags({ campo, values }) {
  if (!values.length) return null
  return values.map((v) => (
    <Link key={v} to={`/risultati?campo=${campo}&q=${encodeURIComponent(v)}`} className="tag">{v}</Link>
  ))
}

export default function Dettaglio() {
  const { id } = useParams()
  const photo = getPhotoDetail(id)
  const [page, setPage] = useState(0)
  useEffect(() => setPage(0), [id])

  if (!photo) {
    return (
      <main className="container">
        <p style={{ marginTop: '2rem' }}>Scheda {id} non trovata. <Link to="/risultati">Torna all'archivio</Link></p>
      </main>
    )
  }

  const src = imageUrl(photo, 'large', page)
  const pdf = pdfUrl(photo)
  const pages = photo.immagini?.length || 0
  const subtitle = [photo.citta, photo.luogo, photo.data].filter(Boolean).join(' — ')

  return (
    <main className="container">
      <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
        <Link to="/risultati">&larr; Torna ai risultati</Link>
      </p>

      <article className="detail">
        <div>
          {pdf ? (
            // documento completo (bollettini): il PDF si sfoglia direttamente nella pagina
            <div className="pdf-viewer">
              <iframe src={`${pdf}#view=FitH`} title={`${photo.titolo} (PDF)`} />
              <p className="pdf-actions">
                <a href={pdf} className="btn" target="_blank" rel="noreferrer">Apri il PDF a schermo intero</a>
              </p>
            </div>
          ) : src ? (
            // lente: passando il mouse compare il dettaglio ingrandito a fianco
            <HoverZoom key={src} src={src} alt={pages > 1 ? `${photo.titolo}, pagina ${page + 1}` : photo.titolo} />
          ) : !photo.video && !photo.audio && (
            <div className="hover-zoom-empty">Immagine in digitalizzazione</div>
          )}
          {src && !pdf && <p className="form-helper">Passa il mouse sull'immagine per vedere i dettagli ingranditi.</p>}

          {!pdf && pages > 1 && (
            <div className="pages">
              {photo.immagini.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  className={`pages-thumb${i === page ? ' active' : ''}`}
                  onClick={() => setPage(i)}
                  aria-label={`Pagina ${i + 1}`}
                >
                  <img src={imageUrl(photo, 'thumbs', i)} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}

          <VideoEmbed url={photo.video} title={photo.titolo} />
          <AudioPlayer src={audioUrl(photo)} label="Ascolta l'audio" />
        </div>

        <div className="detail-meta">
          <h2>{photo.titolo}</h2>
          <p className="detail-subtitle">{subtitle}</p>

          <dl>
            <Field label="Identificativo">{photo.id}</Field>
            <Field label="Autore">
              {photo.autore && <Link to={`/risultati?campo=autore&q=${encodeURIComponent(photo.autore)}`}>{photo.autore}</Link>}
            </Field>
            <Field label="Data">{photo.data}</Field>
            <Field label="Città">
              {photo.citta && <Link to={`/risultati?campo=luogo&q=${encodeURIComponent(photo.citta)}`}>{photo.citta}</Link>}
            </Field>
            <Field label="Luogo">{photo.luogo}</Field>
            <Field label="Evento">{photo.evento}</Field>
            <Field label="Fondo">{photo.fondo}</Field>
            <Field label="Serie">{photo.serie}</Field>
            <Field label="Formato">{formati(photo).join(', ')}</Field>
            <Field label="Luogo di stampa">{photo.luogoStampa}</Field>
            <Field label="Tipologia">{photo.tipologia}</Field>
            <Field label="Supporto">{photo.supporto}</Field>
            <Field label="Dimensioni">{photo.dimensioni}</Field>
            <Field label="Orientamento">{photo.orientamento}</Field>
            <Field label="Colore">{photo.colore}</Field>
            <Field label="Pagine">{photo.pagine}</Field>
            <Field label="Persone">{photo.persone.length > 0 && <Tags campo="persone" values={photo.persone} />}</Field>
            <Field label="Formazione politica">{photo.formazione.length > 0 && <Tags campo="formazione" values={photo.formazione} />}</Field>
            <Field label="Parole chiave">{photo.parole.length > 0 && <Tags campo="parole" values={photo.parole} />}</Field>
            <Field label="Note">{photo.note}</Field>
          </dl>
        </div>
      </article>
    </main>
  )
}

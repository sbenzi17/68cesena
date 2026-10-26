import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Thumb from '../components/Thumb'
import Lightbox, { useLightbox } from '../components/Lightbox'
import { search, toThumb } from '../data/photos'

const PAGE = 48

export default function Risultati() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const campo = searchParams.get('campo')
  const [shown, setShown] = useState(PAGE)
  useEffect(() => setShown(PAGE), [q, campo])

  const results = useMemo(() => search(q, campo).map(toThumb), [q, campo])
  const visible = results.slice(0, shown)
  const withImage = visible.filter(p => p.src)
  const lb = useLightbox(withImage)

  const titolo = q ? `Risultati per "${q}"` : 'Tutto l\'archivio'

  return (
    <main className="container">
      <h2 className="section-title">
        {titolo}
        <span className="count">{results.length} documenti</span>
      </h2>

      {results.length === 0 && <p>Nessun documento trovato.</p>}

      <div className="grid">
        {visible.map((p) => (
          <Thumb key={p.id} photo={p} onClick={lb.open} />
        ))}
      </div>

      {shown < results.length && (
        <p style={{ textAlign: 'center', margin: '2rem 0' }}>
          <button className="btn btn-secondary" onClick={() => setShown(s => s + PAGE)}>
            Mostra altri ({results.length - shown})
          </button>
        </p>
      )}

      <Lightbox
        photos={withImage}
        index={lb.index}
        onClose={lb.close}
        onPrev={lb.prev}
        onNext={lb.next}
      />
    </main>
  )
}

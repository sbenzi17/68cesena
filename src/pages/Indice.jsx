import { Link, useSearchParams } from 'react-router-dom'
import { buildIndex } from '../data/photos'
import { usePageMeta } from '../lib/meta'

function Lista({ data }) {
  return (
    <ul className="index-list">
      {data.items.map((item) => (
        <li key={item.name}>
          <Link to={`/risultati?campo=${data.campo}&q=${encodeURIComponent(item.name)}`}>
            <span className="index-name">{item.name}</span>
            <span className="index-count">{item.count}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

const isFoto = (r) => r.serie === 'Fotografie'

export default function Indice() {
  const [searchParams] = useSearchParams()
  const campo = searchParams.get('campo') || 'autore'
  const data = buildIndex(campo)
  usePageMeta(`Indice per ${data.titolo.toLowerCase()}`, `Indice per ${data.titolo.toLowerCase()} dell'archivio 1968/1977 a Cesena: ${data.items.slice(0, 12).map(i => i.name).join(', ')}…`)

  // Autori: in alto chi ha scattato le fotografie, in basso gli autori dei documenti (volantini, bollettini…)
  if (data.campo === 'autore') {
    const foto = buildIndex('autore', isFoto)
    const documenti = buildIndex('autore', (r) => !isFoto(r))
    return (
      <main className="container">
        <h1 className="section-title">Indice — Autore</h1>
        <h2 className="index-section">Fotografie <span className="count">{foto.items.length} autori</span></h2>
        <Lista data={foto} />
        <h2 className="index-section">Documenti <span className="count">{documenti.items.length} autori</span></h2>
        <Lista data={documenti} />
      </main>
    )
  }

  return (
    <main className="container">
      <h1 className="section-title">
        Indice — {data.titolo}
        <span className="count">{data.items.length} voci</span>
      </h1>
      <Lista data={data} />
    </main>
  )
}

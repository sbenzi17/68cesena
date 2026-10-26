import { Link, useSearchParams } from 'react-router-dom'
import { buildIndex } from '../data/photos'

export default function Indice() {
  const [searchParams] = useSearchParams()
  const data = buildIndex(searchParams.get('campo') || 'autore')

  return (
    <main className="container">
      <h2 className="section-title">
        Indice — {data.titolo}
        <span className="count">{data.items.length} voci</span>
      </h2>

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
    </main>
  )
}

import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Brand from './Brand'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  )
}

// Ricerca sempre disponibile nell'header; sulla pagina dei risultati mostra la ricerca in corso
function HeaderSearch() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const current = location.pathname === '/risultati' && !params.get('campo') ? params.get('q') || '' : ''
  const [q, setQ] = useState(current)
  useEffect(() => setQ(current), [current])

  const onSubmit = (e) => {
    e.preventDefault()
    navigate(`/risultati?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <form className="header-search" role="search" onSubmit={onSubmit}>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cerca nell'archivio…"
        aria-label="Cerca nell'archivio"
      />
      <button type="submit" aria-label="Cerca"><SearchIcon /></button>
    </form>
  )
}

export default function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <Brand />
        <HeaderSearch />
      </div>
    </header>
  )
}

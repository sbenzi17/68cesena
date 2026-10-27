import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'

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

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="1" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  )
}

function Emblem() {
  return (
    <svg className="logo-emblem" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="40" cy="40" r="37" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="40" cy="40" r="33" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.45" />
      <circle cx="40" cy="40" r="29" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.25" />
      <text
        x="40" y="50"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="30"
        fontWeight="500"
        fill="currentColor"
        letterSpacing="-1"
      >AF</text>
      <circle cx="40" cy="14" r="1.4" fill="currentColor" />
      <circle cx="40" cy="66" r="1.4" fill="currentColor" />
      <circle cx="14" cy="40" r="1.4" fill="currentColor" />
      <circle cx="66" cy="40" r="1.4" fill="currentColor" />
    </svg>
  )
}

export default function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="logo">
          <span className="logo-emblem-wrap" aria-hidden="true"><Emblem /></span>
          <span className="logo-text">
            <span className="logo-title">Archivio<br />Fotografico</span>
            <small>Istituto Storico della Resistenza<br />Forlì-Cesena</small>
          </span>
        </Link>

        <HeaderSearch />

        <div className="header-actions">
          <Link to="/login">
            <LockIcon /> Area riservata
          </Link>
        </div>
      </div>
    </header>
  )
}

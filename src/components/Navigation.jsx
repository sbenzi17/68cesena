import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'

const links = [
  { to: '/', campo: null, label: 'Home' },
  { to: '/indice?campo=autore', campo: 'autore', label: 'Autore' },
  { to: '/indice?campo=luogo', campo: 'luogo', label: 'Città / Luogo' },
  { to: '/indice?campo=data', campo: 'data', label: 'Data' },
  { to: '/indice?campo=persone', campo: 'persone', label: 'Persone' },
  { to: '/indice?campo=formazione', campo: 'formazione', label: 'Formazione politica' },
  { to: '/indice?campo=parole', campo: 'parole', label: 'Parole chiave' },
  { to: '/indice?campo=formato', campo: 'formato', label: 'Formato' },
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const currentCampo = searchParams.get('campo')

  const isActive = (link) => {
    if (link.campo === null) return location.pathname === '/'
    return location.pathname === '/indice' && currentCampo === link.campo
  }

  return (
    <nav className={`main-nav${isOpen ? ' open' : ''}`}>
      <div className="container">
        <span className="nav-brand">Menu</span>
        <button
          className={`nav-toggle${isOpen ? ' open' : ''}`}
          onClick={() => setIsOpen(o => !o)}
          aria-label="Apri menu"
          aria-expanded={isOpen}
        >
          <span className="nav-toggle-bar"></span>
          <span className="nav-toggle-bar"></span>
          <span className="nav-toggle-bar"></span>
        </button>
        <ul>
          {links.map((l) => (
            <li key={l.label}>
              <Link to={l.to} className={isActive(l) ? 'active' : ''} onClick={() => setIsOpen(false)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

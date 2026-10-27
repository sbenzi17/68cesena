import { Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase, hasBackend } from '../lib/supabase'

export default function AdminHeader() {
  const navigate = useNavigate()

  const logout = async (e) => {
    e.preventDefault()
    if (hasBackend) await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="admin-header">
      <div className="container">
        <div className="logo">
          Pannello di amministrazione
          <small>Archivio Fotografico</small>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end>Schede</NavLink>
          {hasBackend && <NavLink to="/admin/storico">Storico</NavLink>}
          {hasBackend && <NavLink to="/admin/utenti">Utenti</NavLink>}
          <Link to="/">Sito pubblico</Link>
          <a href="#" onClick={logout}>Esci</a>
        </nav>
      </div>
    </header>
  )
}

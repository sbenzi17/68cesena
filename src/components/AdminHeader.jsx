import { NavLink, useNavigate } from 'react-router-dom'
import { supabase, hasBackend } from '../lib/supabase'
import { loadCatalogo } from '../data/photos'

export default function AdminHeader() {
  const navigate = useNavigate()

  const logout = async (e) => {
    e.preventDefault()
    if (hasBackend) {
      await supabase.auth.signOut()
      await loadCatalogo() // senza login le schede sospese non si vedono più
    }
    navigate('/')
  }

  return (
    <header className="admin-header">
      <div className="container">
        <div className="logo">
          Pannello di amministrazione
          <small>1968/1977 a Cesena</small>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end>Schede</NavLink>
          <NavLink to="/admin/anteprima">Anteprima</NavLink>
          {hasBackend && <NavLink to="/admin/storico">Storico</NavLink>}
          {hasBackend && <NavLink to="/admin/evento">Evento</NavLink>}
          {hasBackend && <NavLink to="/admin/utenti">Utenti</NavLink>}
          {hasBackend && <NavLink to="/admin/stato">Stato</NavLink>}
          <a href="#" onClick={logout}>Esci</a>
        </nav>
      </div>
    </header>
  )
}

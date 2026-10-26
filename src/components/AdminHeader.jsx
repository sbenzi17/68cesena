import { Link, useNavigate } from 'react-router-dom'
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
        <div>
          <Link to="/">Sito pubblico</Link>
          &nbsp;·&nbsp;
          <a href="#" onClick={logout}>Esci</a>
        </div>
      </div>
    </header>
  )
}

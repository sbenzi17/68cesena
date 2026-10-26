import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, hasBackend, isAdmin } from '../lib/supabase'
import { loadCatalogo } from '../data/photos'

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!hasBackend) return navigate('/admin')
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: form.get('email'),
      password: form.get('password'),
    })
    if (error) {
      setError('Email o password non corretti.')
    } else if (!(await isAdmin())) {
      await supabase.auth.signOut()
      setError('Questo account non ha accesso al pannello di amministrazione.')
    } else {
      await loadCatalogo() // ricarica includendo le schede non pubblicate, visibili solo agli admin
      navigate('/admin')
    }
    setBusy(false)
  }

  return (
    <main>
      <form className="login-wrap" onSubmit={onSubmit}>
        <h1>Area riservata</h1>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required autoComplete="username" />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" required autoComplete="current-password" />
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button type="submit" className="btn btn-block" disabled={busy}>
          {busy ? 'Accesso in corso…' : 'Accedi'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          Non hai un account? <Link to="/registro">Registrati</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
          <Link to="/">&larr; Torna al sito</Link>
        </p>
      </form>
    </main>
  )
}

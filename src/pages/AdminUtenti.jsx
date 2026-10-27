import { useEffect, useState } from 'react'
import { supabase, listUsers, createUser, updateUser, removeUser } from '../lib/supabase'

const when = (iso) => iso ? new Date(iso).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' }) : 'mai'
const field = { padding: '0.55rem 0.75rem', border: '1px solid var(--border)', fontSize: '0.9rem' }

// Esegue un'azione del form mostrando esito o errore; restituisce true se è andata bene
function useAction() {
  const [state, setState] = useState({ busy: false, ok: '', error: '' })
  const run = async (fn, ok) => {
    setState({ busy: true, ok: '', error: '' })
    try {
      await fn()
      setState({ busy: false, ok, error: '' })
      return true
    } catch (err) {
      setState({ busy: false, ok: '', error: err.message })
      return false
    }
  }
  const Feedback = () => (
    <>
      {state.ok && <p className="form-ok" role="status">{state.ok}</p>}
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
    </>
  )
  return [state.busy, run, Feedback]
}

export default function AdminUtenti() {
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [resetFor, setResetFor] = useState(null)
  const [busy, run, Feedback] = useAction()
  const [busyMe, runMe, FeedbackMe] = useAction()

  const load = () => listUsers().then(setData).catch(err => setLoadError(err.message))
  useEffect(() => { load() }, [])

  if (loadError) return <main className="container"><p className="form-error">Impossibile leggere gli utenti: {loadError}</p></main>
  if (!data) return <p className="app-loading">Caricamento…</p>

  const me = data.utenti.find(u => u.id === data.me)

  const onCreate = async (e) => {
    e.preventDefault()
    const formEl = e.currentTarget
    const f = Object.fromEntries(new FormData(formEl))
    if (await run(() => createUser(f), `${f.nome} è ora amministratore. Comunica email e password alla persona: potrà cambiare la password da questa pagina.`)) {
      formEl.reset()
      load()
    }
  }

  const onReset = async (e, u) => {
    e.preventDefault()
    const password = new FormData(e.currentTarget).get('password')
    if (await run(() => updateUser(u.id, { password }), `Password di ${u.nome} reimpostata.`)) setResetFor(null)
  }

  const onRemove = async (u) => {
    if (!window.confirm(`Togliere l'accesso a ${u.nome} (${u.email})? L'account viene eliminato; le sue modifiche restano nello storico.`)) return
    if (await run(() => removeUser(u.id), `${u.nome} rimosso.`)) load()
  }

  const onMyName = async (e) => {
    e.preventDefault()
    const nome = new FormData(e.currentTarget).get('nome').trim()
    if (await runMe(() => updateUser(me.id, { nome }), 'Nome aggiornato.')) load()
  }

  const onMyPassword = async (e) => {
    e.preventDefault()
    const formEl = e.currentTarget
    const { password, conferma } = Object.fromEntries(new FormData(formEl))
    await runMe(async () => {
      if (password.length < 8) throw new Error('La password deve avere almeno 8 caratteri.')
      if (password !== conferma) throw new Error('Le due password non coincidono.')
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      formEl.reset()
    }, 'Password cambiata.')
  }

  return (
    <main className="container">
      <div className="admin-toolbar">
        <h1>Amministratori</h1>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
        <table className="table">
          <thead>
            <tr><th>Nome</th><th>Email</th><th>Ultimo accesso</th><th>Azioni</th></tr>
          </thead>
          <tbody>
            {data.utenti.map(u => (
              <tr key={u.id}>
                <td>{u.nome}{u.id === data.me && <> <span className="badge">tu</span></>}</td>
                <td>{u.email}</td>
                <td>{when(u.ultimoAccesso)}</td>
                <td>
                  {u.id !== data.me && (
                    resetFor === u.id ? (
                      <form onSubmit={(e) => onReset(e, u)} style={{ display: 'flex', gap: '0.4rem' }}>
                        <input type="text" name="password" minLength={8} required placeholder="Nuova password" style={field} autoComplete="off" />
                        <button type="submit" className="btn" disabled={busy}>Salva</button>
                        <button type="button" className="btn btn-secondary" onClick={() => setResetFor(null)}>Annulla</button>
                      </form>
                    ) : (
                      <>
                        <button type="button" className="action" onClick={() => setResetFor(u.id)}>Reimposta password</button>
                        {' · '}
                        <button type="button" className="action" onClick={() => onRemove(u)} disabled={busy}>Rimuovi</button>
                      </>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Feedback />

      <section className="admin-panel">
        <h2>Aggiungi un amministratore</h2>
        <form onSubmit={onCreate}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nuovo-nome">Nome</label>
              <input type="text" id="nuovo-nome" name="nome" required />
            </div>
            <div className="form-group">
              <label htmlFor="nuovo-email">Email</label>
              <input type="email" id="nuovo-email" name="email" required autoComplete="off" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="nuovo-password">Password iniziale (almeno 8 caratteri)</label>
            <input type="text" id="nuovo-password" name="password" minLength={8} required autoComplete="off" />
            <p className="form-helper">Non viene inviata nessuna email: comunica tu la password alla persona.</p>
          </div>
          <button type="submit" className="btn" disabled={busy}>Aggiungi</button>
        </form>
      </section>

      {me && (
        <section className="admin-panel">
          <h2>Il mio account · {me.email}</h2>
          <form onSubmit={onMyName} className="form-row" style={{ alignItems: 'end' }}>
            <div className="form-group">
              <label htmlFor="mio-nome">Nome mostrato nello storico</label>
              <input type="text" id="mio-nome" name="nome" defaultValue={me.nome} required />
            </div>
            <div className="form-group">
              <button type="submit" className="btn btn-secondary" disabled={busyMe}>Salva nome</button>
            </div>
          </form>
          <form onSubmit={onMyPassword}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mia-password">Nuova password</label>
                <input type="password" id="mia-password" name="password" required autoComplete="new-password" />
              </div>
              <div className="form-group">
                <label htmlFor="mia-conferma">Ripeti la password</label>
                <input type="password" id="mia-conferma" name="conferma" required autoComplete="new-password" />
              </div>
            </div>
            <button type="submit" className="btn" disabled={busyMe}>Cambia password</button>
          </form>
          <FeedbackMe />
        </section>
      )}
    </main>
  )
}

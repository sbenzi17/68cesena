import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadStorico, restoreStorico, getPhotoDetail } from '../data/photos'
import { listUsers } from '../lib/supabase'

const PAGE = 50

// Colonne del database, nell'ordine in cui le mostriamo
const labels = {
  titolo: 'Titolo', status: 'Stato', autore: 'Autore', data: 'Data', data_ord: 'Data per ordinamento',
  citta: 'Città', luogo: 'Luogo', luogo_stampa: 'Luogo di stampa', evento: 'Evento', fondo: 'Fondo',
  serie: 'Serie', tipologia: 'Tipologia', supporto: 'Supporto', dimensioni: 'Dimensioni', orientamento: 'Orientamento',
  colore: 'Colore', particolare: 'Particolare', fronte_retro: 'Fronte / retro', pagine: 'Pagine',
  sequenza: 'Sequenza', persone: 'Persone', formazione: 'Formazione politica', parole: 'Parole chiave',
  note: 'Note', immagini: 'Immagini', pdf: 'PDF',
}

const azioni = {
  INSERT: ['Creata', 'badge-ok'],
  UPDATE: ['Modificata', 'badge-warn'],
  DELETE: ['Eliminata', 'badge-danger'],
}

const show = (v) => Array.isArray(v) ? v.join(' · ') : (v ?? '')
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const when = (iso) => new Date(iso).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })

function Diff({ entry }) {
  const { prima, dopo, azione } = entry
  if (azione !== 'UPDATE') {
    const r = dopo || prima
    return <p className="muted-text">{r.titolo}</p>
  }
  const changed = Object.keys(labels).filter(k => !same(prima[k], dopo[k]))
  if (!changed.length) return <p className="muted-text">Nessun campo cambiato.</p>
  return (
    <table className="storico-diff">
      <tbody>
        {changed.map(k => (
          <tr key={k}>
            <th>{labels[k]}</th>
            <td className="old">{show(prima[k])}</td>
            <td className="new">{show(dopo[k])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function AdminStorico() {
  const [params, setParams] = useSearchParams()
  const scheda = params.get('scheda') || ''
  const [entries, setEntries] = useState([])
  const [more, setMore] = useState(false)
  const [names, setNames] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async (from = 0) => {
    setError('')
    try {
      const rows = await loadStorico({ schedaId: scheda, from, size: PAGE })
      setEntries(prev => from ? [...prev, ...rows] : rows)
      setMore(rows.length === PAGE)
    } catch (err) {
      setError(`Impossibile leggere lo storico: ${err.message}`)
    }
  }

  useEffect(() => { load() }, [scheda])
  useEffect(() => {
    listUsers()
      .then(({ utenti }) => setNames(Object.fromEntries(utenti.map(u => [u.id, u.nome || u.email]))))
      .catch(() => {})
  }, [])

  const who = (uid) => uid ? names[uid] || 'utente rimosso' : 'importazione iniziale'

  const restore = async (entry) => {
    const current = getPhotoDetail(entry.scheda_id)
    const outdated = entry.dopo && current && Date.parse(current.updatedAt) !== Date.parse(entry.dopo.updated_at)
    const what = entry.azione === 'INSERT' ? 'eliminare la scheda (annullando la creazione)' : 'riportare la scheda com\'era prima di questa modifica'
    const warning = outdated ? '\n\nAttenzione: la scheda è stata modificata ancora dopo; anche quelle modifiche verranno annullate.' : ''
    if (!window.confirm(`Scheda ${entry.scheda_id}: vuoi ${what}?${warning}`)) return
    setBusy(true)
    setMessage('')
    try {
      await restoreStorico(entry)
      setMessage(`Scheda ${entry.scheda_id} ripristinata. Il ripristino compare in cima allo storico e si può a sua volta annullare.`)
      await load()
    } catch (err) {
      setError(`Ripristino non riuscito: ${err.message}`)
    }
    setBusy(false)
  }

  return (
    <main className="container">
      <div className="admin-toolbar">
        <h1>Storico delle modifiche{scheda && ` · scheda ${scheda}`}</h1>
        {scheda && <Link to={`/admin/foto/${scheda}`} className="btn btn-secondary">Apri la scheda</Link>}
      </div>

      <form
        style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}
        onSubmit={(e) => { e.preventDefault(); const v = new FormData(e.currentTarget).get('scheda').trim(); setParams(v ? { scheda: v } : {}) }}
      >
        <input
          type="text" name="scheda" defaultValue={scheda} key={scheda}
          placeholder="Identificativo della scheda, es. 084"
          style={{ flex: 1, padding: '0.6rem 0.8rem', border: '1px solid var(--border)', fontSize: '0.9rem' }}
        />
        <button type="submit" className="btn">Filtra</button>
        {scheda && <button type="button" className="btn btn-secondary" onClick={() => setParams({})}>Tutte</button>}
      </form>

      {message && <p className="form-ok" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {entries.map(e => {
        const [label, cls] = azioni[e.azione] || [e.azione, '']
        const canRestore = e.utente || e.azione !== 'INSERT'
        return (
          <article key={e.id} className="storico-entry">
            <div className="storico-head">
              <span className={`badge ${cls}`}>{label}</span>
              <Link to={`/admin/foto/${e.scheda_id}`}>Scheda {e.scheda_id}</Link>
              <span>{who(e.utente)}</span>
              <time dateTime={e.quando}>{when(e.quando)}</time>
              {canRestore && (
                <span className="storico-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => restore(e)} disabled={busy}>
                    {e.azione === 'INSERT' ? 'Annulla creazione' : 'Ripristina com\'era prima'}
                  </button>
                </span>
              )}
            </div>
            <Diff entry={e} />
          </article>
        )
      })}

      {!entries.length && !error && <p className="muted-text">Nessuna modifica registrata.</p>}
      {more && (
        <p style={{ textAlign: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={() => load(entries.length)}>Mostra altre</button>
        </p>
      )}
    </main>
  )
}

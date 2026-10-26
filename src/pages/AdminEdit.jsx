import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPhotoDetail, imageUrl, saveRecord, deleteRecord, nextId } from '../data/photos'
import { hasBackend } from '../lib/supabase'

const empty = {
  titolo: '', autore: '', data: '', dataOrd: '', citta: '', luogo: '', evento: '',
  fondo: 'Fondo Maurizio Benzi', serie: 'Fotografie', tipologia: 'fotografia', status: 'ok',
  persone: [], formazione: [], parole: [], note: '', immagini: [],
}

const textFields = [
  ['titolo', 'Titolo'],
  ['autore', 'Autore'],
  ['data', 'Data'],
  ['dataOrd', 'Data per ordinamento (aaaa.mm.gg)'],
  ['citta', 'Città'],
  ['luogo', 'Luogo'],
  ['evento', 'Evento'],
  ['fondo', 'Fondo'],
  ['serie', 'Serie'],
  ['tipologia', 'Tipologia'],
  ['supporto', 'Supporto'],
  ['orientamento', 'Orientamento'],
  ['colore', 'Colore'],
]

const listFields = [
  ['persone', 'Persone (separate da virgola)'],
  ['formazione', 'Formazione politica'],
  ['parole', 'Parole chiave'],
]

export default function AdminEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'nuova'
  const [original] = useState(() => isNew ? { ...empty, id: nextId() } : getPhotoDetail(id))
  const [preview, setPreview] = useState(original ? imageUrl(original, 'large') : null)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!original) {
    return <main className="container"><p>Scheda non trovata. <Link to="/admin">Indietro</Link></p></main>
  }

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const record = { ...original }
    for (const [k] of textFields) record[k] = (form.get(k) || '').trim()
    for (const [k] of listFields) record[k] = (form.get(k) || '').split(',').map(s => s.trim()).filter(Boolean)
    record.note = (form.get('note') || '').trim()
    setBusy(true)
    setError('')
    try {
      const saved = await saveRecord(record, file)
      navigate(`/foto/${saved.id}`)
    } catch (err) {
      setError(`Salvataggio non riuscito: ${err.message}`)
      setBusy(false)
    }
  }

  const onDelete = async () => {
    if (!window.confirm(`Eliminare definitivamente la scheda ${original.id} e le sue immagini?`)) return
    setBusy(true)
    try {
      await deleteRecord(original.id)
      navigate('/admin')
    } catch (err) {
      setError(`Eliminazione non riuscita: ${err.message}`)
      setBusy(false)
    }
  }

  return (
    <main className="container">
      <div className="admin-toolbar">
        <h1>{isNew ? `Nuova fotografia · ${original.id}` : `Modifica fotografia · ${original.id}`}</h1>
        <Link to="/admin" className="btn btn-secondary">&larr; Indietro</Link>
      </div>

      {!hasBackend && (
        <p className="demo-note">
          Versione dimostrativa: le modifiche vengono salvate solo in questo browser.
        </p>
      )}

      <form className="detail" onSubmit={onSubmit}>
        <div>
          <div
            className={`detail-img thumb-img bg-${(parseInt(original.id, 10) % 8) + 1}${preview ? ' has-img' : ''}`}
            data-label={preview ? '' : 'Nessuna immagine'}
          >
            {preview && <img src={preview} alt="" />}
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="file">{preview ? 'Sostituisci immagine' : 'Carica immagine'}</label>
            <input type="file" id="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} />
          </div>
          {original.immagini?.length > 1 && (
            <p className="muted-text">Documento di {original.immagini.length} pagine: la sostituzione riguarda la prima.</p>
          )}
        </div>

        <div className="detail-meta">
          {textFields.map(([k, label]) => (
            <div className="form-group" key={k}>
              <label htmlFor={k}>{label}</label>
              <input type="text" id={k} name={k} defaultValue={original[k]} />
            </div>
          ))}

          {listFields.map(([k, label]) => (
            <div className="form-group" key={k}>
              <label htmlFor={k}>{label}</label>
              <input type="text" id={k} name={k} defaultValue={(original[k] || []).join(', ')} />
            </div>
          ))}

          <div className="form-group">
            <label htmlFor="note">Note</label>
            <textarea id="note" name="note" rows={4} defaultValue={original.note} />
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" className="btn" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva modifiche'}</button>
          &nbsp;
          <Link to="/admin" className="btn btn-secondary">Annulla</Link>
          {!isNew && (
            <>
              &nbsp;
              <button type="button" className="btn btn-secondary btn-danger" onClick={onDelete} disabled={busy}>Elimina scheda</button>
            </>
          )}
        </div>
      </form>
    </main>
  )
}

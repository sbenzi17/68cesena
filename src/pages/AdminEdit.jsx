import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPhotoDetail, imageUrl, saveRecord, deleteRecord, nextId, distinctValues } from '../data/photos'
import { hasBackend } from '../lib/supabase'

const empty = {
  titolo: '', autore: '', data: '', dataOrd: '', citta: 'Cesena', luogo: '', evento: '',
  fondo: 'Fondo Maurizio Benzi', serie: 'Fotografie', tipologia: '', status: 'ok',
  persone: [], formazione: [], parole: [], note: '', immagini: [],
}

// [campo, etichetta, suggerimenti dai valori già usati]
const sections = [
  ['Descrizione', [
    ['autore', 'Autore', true],
    ['data', 'Data (come scritta sul documento)'],
    ['dataOrd', 'Data per ordinamento (aaaa.mm.gg)'],
    ['citta', 'Città', true],
    ['luogo', 'Luogo', true],
    ['luogoStampa', 'Luogo di stampa', true],
    ['evento', 'Evento', true],
  ]],
  ['Classificazione', [
    ['fondo', 'Fondo', true],
    ['serie', 'Serie', true],
    ['tipologia', 'Tipologia', true],
    ['supporto', 'Supporto', true],
    ['dimensioni', 'Dimensioni originale', true],
    ['colore', 'Colore', true],
    ['particolare', 'Particolare', true],
    ['fronteRetro', 'Fronte / retro', true],
    ['pagine', 'Pagine'],
    ['sequenza', 'Sequenza'],
  ]],
]
const textFields = sections.flatMap(([, fields]) => fields)

const listFields = [
  ['persone', 'Persone'],
  ['formazione', 'Formazione politica'],
  ['parole', 'Parole chiave'],
]

let pageKey = 0
const toPage = (name) => ({ key: ++pageKey, name, url: imageUrl({ immagini: [name] }, 'thumbs'), large: imageUrl({ immagini: [name] }, 'large') })
const fromFile = (file) => {
  const url = URL.createObjectURL(file)
  return { key: ++pageKey, file, url, large: url }
}

export default function AdminEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'nuova'
  const [original] = useState(() => isNew ? { ...empty, id: nextId() } : getPhotoDetail(id))
  const [pages, setPages] = useState(() => (original?.immagini || []).map(toPage))
  const [selected, setSelected] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const suggestions = useMemo(
    () => Object.fromEntries(textFields.filter(f => f[2]).map(([k]) => [k, distinctValues(k)])),
    [],
  )

  if (!original) {
    return <main className="container"><p>Scheda non trovata. <Link to="/admin">Indietro</Link></p></main>
  }

  const current = pages[Math.min(selected, pages.length - 1)]
  const pagesChanged = pages.some(p => p.file) || pages.map(p => p.name).join() !== (original.immagini || []).join()

  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= pages.length) return
    const next = [...pages];
    [next[i], next[j]] = [next[j], next[i]]
    setPages(next)
    setSelected(j)
  }
  const remove = (i) => { setPages(pages.filter((_, k) => k !== i)); setSelected(Math.max(0, i - 1)) }
  const replace = (i, file) => file && setPages(pages.map((p, k) => k === i ? fromFile(file) : p))
  const add = (files) => {
    if (!files?.length) return
    const sorted = Array.from(files).sort((a, b) => a.name.localeCompare(b.name, 'it', { numeric: true }))
    setPages([...pages, ...sorted.map(fromFile)])
    setSelected(pages.length)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const record = { ...original }
    record.titolo = (form.get('titolo') || '').trim()
    record.status = form.get('status')
    record.orientamento = form.get('orientamento')
    for (const [k] of textFields) record[k] = (form.get(k) || '').trim()
    for (const [k] of listFields) record[k] = (form.get(k) || '').split('\n').map(s => s.trim()).filter(Boolean)
    record.note = (form.get('note') || '').trim()
    setBusy(true)
    setError('')
    try {
      const saved = await saveRecord(record, pagesChanged ? pages : undefined)
      navigate(`/foto/${saved.id}`)
    } catch (err) {
      setError(`Salvataggio non riuscito: ${err.message}`)
      setBusy(false)
    }
  }

  const onDelete = async () => {
    if (!window.confirm(`Eliminare la scheda ${original.id}? Si potrà ripristinare dallo storico.`)) return
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
        <h1>{isNew ? `Nuova scheda · ${original.id}` : `Modifica scheda · ${original.id}`}</h1>
        <div>
          {!isNew && hasBackend && <Link to={`/admin/storico?scheda=${original.id}`} className="btn btn-secondary">Storico</Link>}
          &nbsp;
          <Link to="/admin" className="btn btn-secondary">&larr; Indietro</Link>
        </div>
      </div>

      {!hasBackend && (
        <p className="demo-note">
          Versione dimostrativa: le modifiche vengono salvate solo in questo browser.
        </p>
      )}

      <form className="detail" onSubmit={onSubmit}>
        <div>
          <div
            className={`detail-img thumb-img bg-${(parseInt(original.id, 10) % 8) + 1}${current ? ' has-img' : ''}`}
            data-label={current ? '' : 'Nessuna immagine'}
          >
            {current && <img src={current.large} alt="" />}
          </div>

          <h3 className="page-editor-title">Pagine ({pages.length})</h3>
          {pages.length > 0 && (
            <ol className="page-editor">
              {pages.map((p, i) => (
                <li key={p.key} className={p === current ? 'active' : ''}>
                  <button type="button" className="page-editor-thumb" onClick={() => setSelected(i)} aria-label={`Mostra pagina ${i + 1}`}>
                    <img src={p.url} alt="" />
                    <span>{i + 1}{p.file ? ' · nuova' : ''}</span>
                  </button>
                  <div className="page-editor-actions">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Sposta prima">&larr;</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === pages.length - 1} title="Sposta dopo">&rarr;</button>
                    <label title="Sostituisci">
                      &#8635;
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => replace(i, e.target.files?.[0])} hidden />
                    </label>
                    <button type="button" onClick={() => remove(i)} title="Togli pagina">&times;</button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className="form-group">
            <label htmlFor="file">{pages.length ? 'Aggiungi pagine' : 'Carica immagini'}</label>
            <input type="file" id="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => { add(e.target.files); e.target.value = '' }} />
            <p className="form-helper">
              Puoi scegliere più file insieme: vengono aggiunti in fondo, nell'ordine del nome.
              {(original.pdf || original.serie === 'Bollettini') && ' Se cambi le pagine, il PDF viene rigenerato al salvataggio.'}
            </p>
          </div>
        </div>

        <div className="detail-meta">
          <div className="form-group">
            <label htmlFor="titolo">Titolo</label>
            <textarea id="titolo" name="titolo" rows={3} defaultValue={original.titolo} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Stato</label>
              <select id="status" name="status" defaultValue={original.status || 'ok'}>
                <option value="ok">Pubblicata</option>
                <option value="sospeso">Sospesa (visibile solo agli admin)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="orientamento">Orientamento</label>
              <select id="orientamento" name="orientamento" defaultValue={original.orientamento || ''}>
                <option value="">—</option>
                <option value="verticale">verticale</option>
                <option value="orizzontale">orizzontale</option>
              </select>
            </div>
          </div>

          {sections.map(([title, fields]) => (
            <fieldset key={title} className="admin-fieldset">
              <legend>{title}</legend>
              {fields.map(([k, label, suggest]) => (
                <div className="form-group" key={k}>
                  <label htmlFor={k}>{label}</label>
                  <input type="text" id={k} name={k} defaultValue={original[k] || ''} list={suggest ? `${k}-valori` : undefined} />
                  {suggest && (
                    <datalist id={`${k}-valori`}>
                      {suggestions[k].map(v => <option key={v} value={v} />)}
                    </datalist>
                  )}
                </div>
              ))}
            </fieldset>
          ))}

          <fieldset className="admin-fieldset">
            <legend>Indicizzazione</legend>
            {listFields.map(([k, label]) => (
              <div className="form-group" key={k}>
                <label htmlFor={k}>{label} <span className="muted-text">(uno per riga)</span></label>
                <textarea id={k} name={k} rows={Math.max(3, (original[k] || []).length + 1)} defaultValue={(original[k] || []).join('\n')} />
              </div>
            ))}
          </fieldset>

          <div className="form-group">
            <label htmlFor="note">Note</label>
            <textarea id="note" name="note" rows={4} defaultValue={original.note || ''} />
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

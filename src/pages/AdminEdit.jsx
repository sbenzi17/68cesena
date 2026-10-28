import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getPhotoDetail, imageUrl, pdfUrl, pdfFromImages, pdfFirstPage, saveRecord, deleteRecord, nextId, distinctValues } from '../data/photos'
import { precisioni, splitOrd, joinOrd, IT_PATTERN } from '../data/dates'
import { hasBackend } from '../lib/supabase'
import Lightbox from '../components/Lightbox'
import HoverZoom from '../components/HoverZoom'

function ZoomIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8M10.5 7.5v6M7.5 10.5h6" />
    </svg>
  )
}

// Campi "Data per ordinamento" (gg/mm/aaaa), "Precisione" e "fino al"
function DateOrdFields({ value }) {
  const { data, precisione, fine } = splitOrd(value)
  const formati = 'gg/mm/aaaa, mm/aaaa oppure aaaa'
  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dataOrd">Data per ordinamento</label>
          <input type="text" id="dataOrd" name="dataOrd" defaultValue={data} placeholder="gg/mm/aaaa" pattern={IT_PATTERN} title={formati} />
        </div>
        <div className="form-group">
          <label htmlFor="dataPrecisione">Precisione</label>
          <select id="dataPrecisione" name="dataPrecisione" defaultValue={precisione}>
            {precisioni.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="dataFine">Fino al <span className="muted-text">(solo per gli intervalli)</span></label>
        <input type="text" id="dataFine" name="dataFine" defaultValue={fine} placeholder="gg/mm/aaaa" pattern={IT_PATTERN} title={formati} />
        <p className="form-helper">Formati: {formati}. Per una cifra dell'anno sconosciuta usa «?», es. 01/05/197?.</p>
      </div>
    </>
  )
}

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
    ['dataOrd'], // campi dedicati: DateOrdFields
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
const textFields = sections.flatMap(([, fields]) => fields).filter(([k]) => k !== 'dataOrd')

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
  const location = useLocation()
  const isNew = id === 'nuova'
  const [original] = useState(() => isNew ? { ...empty, id: nextId() } : getPhotoDetail(id))
  const [pages, setPages] = useState(() => (original?.immagini || []).map(toPage))
  const [selected, setSelected] = useState(0)
  const [zoom, setZoom] = useState(null)
  // PDF del documento completo: null = invariato, 'togli' = da eliminare, { blob, label } = nuovo
  const [pdf, setPdf] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(Boolean(location.state?.saved))
  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => setSaved(false), 4000)
    return () => clearTimeout(t)
  }, [saved])
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

  // Con un PDF la scheda tiene come immagine (e miniatura) solo la sua prima pagina
  const onPdfFile = async (file) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const cover = await pdfFirstPage(file)
      setPdf({ blob: file, label: file.name })
      setPages([fromFile(cover)])
      setSelected(0)
    } catch (err) {
      setError(`Impossibile leggere il PDF: ${err.message}`)
    }
    setBusy(false)
  }

  // PDF creato nel browser da più immagini: la prima diventa la copertina
  const onPdfImages = async (files) => {
    if (!files?.length) return
    const sorted = Array.from(files).sort((a, b) => a.name.localeCompare(b.name, 'it', { numeric: true }))
    setBusy(true)
    setError('')
    try {
      setPdf({ blob: await pdfFromImages(sorted), label: `creato da ${sorted.length} immagini` })
      setPages([fromFile(sorted[0])])
      setSelected(0)
    } catch (err) {
      setError(`Creazione del PDF non riuscita: ${err.message}`)
    }
    setBusy(false)
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
    const date = joinOrd(form.get('dataOrd'), form.get('dataPrecisione'), form.get('dataFine'))
    setSaved(false)
    if (date.error) {
      setError(date.error)
      document.getElementById('dataOrd')?.focus()
      return
    }
    record.dataOrd = date.value
    setBusy(true)
    setError('')
    try {
      const result = await saveRecord(record, pagesChanged ? pages : undefined, pdf === 'togli' ? null : pdf?.blob)
      // si resta nel pannello: la pagina si ricarica con i dati appena salvati
      navigate(`/admin/foto/${result.id}`, { replace: isNew, state: { saved: true } })
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
          {current ? (
            <div style={{ position: 'relative' }}>
              <HoverZoom key={current.key} src={current.large} onClick={() => setZoom(pages.indexOf(current))} />
              <button type="button" className="zoom-btn" onClick={() => setZoom(pages.indexOf(current))} aria-label="Apri a schermo intero" title="Apri a schermo intero">
                <ZoomIcon />
              </button>
            </div>
          ) : (
            <div className="hover-zoom-empty">Nessuna immagine</div>
          )}
          <p className="form-helper">Passa il mouse sull'immagine per vedere i dettagli ingranditi; clic per aprirla a schermo intero.</p>

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
            <p className="form-helper">Puoi scegliere più file insieme: vengono aggiunti in fondo, nell'ordine del nome.</p>
          </div>

          {hasBackend && (
            <fieldset className="admin-fieldset">
              <legend>PDF del documento completo</legend>
              {pdf === 'togli' ? (
                <p>Il PDF verrà tolto al salvataggio. <button type="button" className="action" onClick={() => setPdf(null)}>Annulla</button></p>
              ) : pdf ? (
                <p className="form-ok">Nuovo PDF pronto ({pdf.label}): verrà caricato al salvataggio. <button type="button" className="action" onClick={() => setPdf(null)}>Annulla</button></p>
              ) : original.pdf ? (
                <p>
                  <a href={pdfUrl(original)} target="_blank" rel="noreferrer">Apri il PDF attuale</a>
                  {' · '}
                  <button type="button" className="action" onClick={() => setPdf('togli')}>Togli il PDF</button>
                </p>
              ) : (
                <p className="muted-text">Nessun PDF.</p>
              )}
              <div className="form-group">
                <label htmlFor="pdf-file">{original.pdf ? 'Sostituisci con un PDF' : 'Carica un PDF'}</label>
                <input type="file" id="pdf-file" accept="application/pdf" onChange={(e) => { onPdfFile(e.target.files?.[0]); e.target.value = '' }} disabled={busy} />
              </div>
              <div className="form-group">
                <label htmlFor="pdf-images">Oppure crea il PDF da più immagini</label>
                <input type="file" id="pdf-images" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => { onPdfImages(e.target.files); e.target.value = '' }} disabled={busy} />
                <p className="form-helper">
                  Le pagine vanno nell'ordine del nome del file. In entrambi i casi la prima pagina del PDF
                  diventa l'immagine (e la miniatura) della scheda, al posto di quelle attuali.
                </p>
              </div>
            </fieldset>
          )}
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
              {fields.map(([k, label, suggest]) => k === 'dataOrd' ? <DateOrdFields key={k} value={original.dataOrd} /> : (
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

        </div>

        {/* Barra fissa in fondo allo schermo: le azioni restano sempre a portata di mano */}
        <div className="admin-actionbar">
          <div className="container">
            <div className="admin-actionbar-msg" aria-live="polite">
              {error && <span className="form-error" role="alert">{error}</span>}
              {saved && !error && <span className="form-ok">Modifiche salvate.</span>}
            </div>
            <div className="admin-actionbar-buttons">
              {!isNew && (
                <button type="button" className="btn btn-secondary btn-danger" onClick={onDelete} disabled={busy}>Elimina scheda</button>
              )}
              <Link to="/admin" className="btn btn-secondary">Chiudi</Link>
              <button type="submit" className="btn" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva modifiche'}</button>
            </div>
          </div>
        </div>
      </form>

      <Lightbox
        photos={pages.map((p, i) => ({ id: original.id, large: p.large, caption: `Pagina ${i + 1} di ${pages.length}`, bg: '' }))}
        index={zoom}
        link={false}
        onClose={() => setZoom(null)}
        onPrev={() => setZoom(z => (z - 1 + pages.length) % pages.length)}
        onNext={() => setZoom(z => (z + 1) % pages.length)}
      />
    </main>
  )
}

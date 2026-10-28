import { useState } from 'react'
import { getEvento, saveEvento, eventoVisibile, eventoImageUrl, eventoPeriodo } from '../data/photos'

// Un unico evento in evidenza: prima slide del banner e sezione informativa sotto il banner
export default function AdminEvento() {
  const [evento, setEvento] = useState(() => getEvento() || { attivo: false })
  const [file, setFile] = useState(null)
  const [anteprima, setAnteprima] = useState(() => eventoImageUrl(getEvento()))
  const [togli, setTogli] = useState(false)
  const [busy, setBusy] = useState(false)
  const [esito, setEsito] = useState({ ok: '', error: '' })

  const onFile = (f) => {
    if (!f) return
    setFile(f)
    setTogli(false)
    setAnteprima(URL.createObjectURL(f))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const dati = {
      attivo: f.get('attivo') === 'on',
      titolo: (f.get('titolo') || '').trim(),
      dal: f.get('dal') || '',
      al: f.get('al') || '',
      testo: (f.get('testo') || '').trim(),
    }
    if (dati.dal && dati.al && dati.al < dati.dal) {
      setEsito({ ok: '', error: 'La data «al» è precedente alla data «dal».' })
      return
    }
    setBusy(true)
    setEsito({ ok: '', error: '' })
    try {
      const saved = await saveEvento(dati, file, togli)
      setEvento(saved)
      setFile(null)
      setAnteprima(eventoImageUrl(saved))
      const visibile = eventoVisibile(saved)
      setEsito({
        ok: visibile ? 'Evento salvato: ora è visibile nella home.'
          : saved.attivo ? 'Evento salvato, ma non si vede perché la data di fine è passata (o manca il titolo).'
            : 'Evento salvato e nascosto: nella home non compare.',
        error: '',
      })
    } catch (err) {
      setEsito({ ok: '', error: `Salvataggio non riuscito: ${err.message}` })
    }
    setBusy(false)
  }

  const visibile = eventoVisibile(evento)

  return (
    <main className="container">
      <div className="admin-toolbar">
        <h1>Evento in evidenza</h1>
        <span className={`badge ${visibile ? 'badge-ok' : ''}`}>{visibile ? 'Visibile nel sito' : 'Nascosto'}</span>
      </div>

      <p className="form-helper" style={{ marginTop: 0 }}>
        Quando è attivo, l'immagine dell'evento è la prima del banner e sotto il banner compare una sezione con titolo,
        date e testo. Dopo la data «al» l'evento sparisce da solo.
      </p>

      <form className="detail" onSubmit={onSubmit}>
        <div>
          {anteprima && !togli ? (
            <img src={anteprima} alt="" className="evento-img" />
          ) : (
            <div className="hover-zoom-empty" style={{ height: '320px', minHeight: 0 }}>Nessuna immagine</div>
          )}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="evento-file">{anteprima && !togli ? 'Sostituisci immagine' : 'Carica immagine'}</label>
            <input type="file" id="evento-file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
          </div>
          {anteprima && !togli && (
            <button type="button" className="action" onClick={() => { setTogli(true); setFile(null) }}>Togli l'immagine</button>
          )}
        </div>

        <div className="detail-meta">
          <label className="checkbox-row" style={{ marginBottom: '1.25rem' }}>
            <input type="checkbox" name="attivo" defaultChecked={evento.attivo} />
            <span><strong>Mostra nel sito</strong> (banner e sezione sotto il banner)</span>
          </label>

          <div className="form-group">
            <label htmlFor="evento-titolo">Titolo</label>
            <input type="text" id="evento-titolo" name="titolo" defaultValue={evento.titolo || ''} placeholder="es. Mercatino a Cesena" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="evento-dal">Dal</label>
              <input type="date" id="evento-dal" name="dal" defaultValue={evento.dal || ''} />
            </div>
            <div className="form-group">
              <label htmlFor="evento-al">Al</label>
              <input type="date" id="evento-al" name="al" defaultValue={evento.al || ''} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="evento-testo">Testo e commenti</label>
            <textarea id="evento-testo" name="testo" rows={8} defaultValue={evento.testo || ''} placeholder="Luogo, orari, descrizione…" />
          </div>
          {evento.titolo && <p className="form-helper">Nel sito ora: «{evento.titolo}» {eventoPeriodo(evento)}</p>}
        </div>

        <div className="admin-actionbar">
          <div className="container">
            <div className="admin-actionbar-msg" aria-live="polite">
              {esito.error && <span className="form-error" role="alert">{esito.error}</span>}
              {esito.ok && <span className="form-ok">{esito.ok}</span>}
            </div>
            <div className="admin-actionbar-buttons">
              <button type="submit" className="btn" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva evento'}</button>
            </div>
          </div>
        </div>
      </form>
    </main>
  )
}

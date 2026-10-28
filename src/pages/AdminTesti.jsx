import { useState } from 'react'
import { getTestoFooter, saveTestoFooter } from '../data/photos'

// Testi del sito modificabili dal pannello (per ora: il testo in alto nel footer)
export default function AdminTesti() {
  const [testo, setTesto] = useState(getTestoFooter)
  const [busy, setBusy] = useState(false)
  const [esito, setEsito] = useState({ ok: '', error: '' })

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setEsito({ ok: '', error: '' })
    try {
      await saveTestoFooter(testo.trim())
      setEsito({ ok: testo.trim() ? 'Testo salvato: compare in fondo a ogni pagina del sito.' : 'Testo tolto dal footer.', error: '' })
    } catch (err) {
      setEsito({ ok: '', error: `Salvataggio non riuscito: ${err.message}` })
    }
    setBusy(false)
  }

  return (
    <main className="container">
      <div className="admin-toolbar">
        <h1>Testi del sito</h1>
      </div>

      <form onSubmit={onSubmit}>
        <section className="admin-panel">
          <h2>Testo del footer</h2>
          <p className="form-helper" style={{ marginTop: 0 }}>
            Compare in fondo a ogni pagina, sopra i link «Collabora · Contattaci · Area riservata».
            Lascia vuoto per non mostrare niente. Gli «a capo» vengono mantenuti.
          </p>
          <div className="form-group">
            <label htmlFor="footer-testo">Testo</label>
            <textarea id="footer-testo" rows={5} value={testo} onChange={(e) => setTesto(e.target.value)} />
          </div>
          {testo.trim() && (
            <>
              <p className="muted-text">Anteprima:</p>
              <div className="site-footer" style={{ margin: '0.5rem 0 0', padding: '1.5rem 1rem' }}>
                <p className="footer-testo">{testo.trim()}</p>
              </div>
            </>
          )}
        </section>

        <div className="admin-actionbar">
          <div className="container">
            <div className="admin-actionbar-msg" aria-live="polite">
              {esito.error && <span className="form-error" role="alert">{esito.error}</span>}
              {esito.ok && <span className="form-ok">{esito.ok}</span>}
            </div>
            <div className="admin-actionbar-buttons">
              <button type="submit" className="btn" disabled={busy}>{busy ? 'Salvataggio…' : 'Salva testi'}</button>
            </div>
          </div>
        </div>
      </form>
    </main>
  )
}

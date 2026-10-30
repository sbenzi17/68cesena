import { useState } from 'react'
import { getTestoFooter, getTestoHome, saveTestiSito } from '../data/photos'

// Testi del sito modificabili dal pannello: testo del footer e testo nella home sotto la ricerca
export default function AdminTesti() {
  const [footer, setFooter] = useState(getTestoFooter)
  const [home, setHome] = useState(getTestoHome)
  const [busy, setBusy] = useState(false)
  const [esito, setEsito] = useState({ ok: '', error: '' })

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setEsito({ ok: '', error: '' })
    try {
      await saveTestiSito({ footer: footer.trim(), home: home.trim() })
      setEsito({ ok: 'Testi salvati.', error: '' })
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
          <h2>Testo nella home</h2>
          <p className="form-helper" style={{ marginTop: 0 }}>
            Compare nella home sotto la ricerca e sopra la sezione «Evento» (se attivo).
            Lascia vuoto per non mostrare niente. Gli «a capo» vengono mantenuti.
          </p>
          <div className="form-group">
            <label htmlFor="home-testo">Testo</label>
            <textarea id="home-testo" rows={6} value={home} onChange={(e) => setHome(e.target.value)} />
          </div>
          {home.trim() && (
            <>
              <p className="muted-text">Anteprima:</p>
              <div className="evento" style={{ margin: '0.5rem 0 0' }}>
                <div className="container evento-inner evento-noimg">
                  <div><div className="evento-testo">{home.trim()}</div></div>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="admin-panel">
          <h2>Testo del footer</h2>
          <p className="form-helper" style={{ marginTop: 0 }}>
            Compare in fondo a ogni pagina, sopra i link «Contattaci · Area riservata».
            Lascia vuoto per non mostrare niente. Gli «a capo» vengono mantenuti.
          </p>
          <div className="form-group">
            <label htmlFor="footer-testo">Testo</label>
            <textarea id="footer-testo" rows={5} value={footer} onChange={(e) => setFooter(e.target.value)} />
          </div>
          {footer.trim() && (
            <>
              <p className="muted-text">Anteprima:</p>
              <div className="site-footer" style={{ margin: '0.5rem 0 0', padding: '1.5rem 1rem' }}>
                <p className="footer-testo">{footer.trim()}</p>
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

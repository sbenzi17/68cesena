import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../lib/meta'

// Invio tramite Web3Forms (gratuito, affidabile). Access key creata su web3forms.com.
const EMAIL = 'info@68cesena.it'
const FORM_ENDPOINT = 'https://api.web3forms.com/submit'
const ACCESS_KEY = 'fd2e6778-b7df-40b3-ac32-96570c1bbd12'

export default function Contatto() {
  usePageMeta('Contattaci', "Scrivi all'archivio 1968/1977 a Cesena: domande, correzioni, ricordi da segnalare.")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSending(true)
    try {
      const data = new FormData(e.currentTarget)
      data.append('access_key', ACCESS_KEY)
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || `HTTP ${res.status}`)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError(`Errore nell'invio. Riprova fra qualche minuto o scrivici direttamente a ${EMAIL}.`)
    } finally {
      setSending(false)
    }
  }

  if (submitted) {
    return (
      <main className="container">
        <div className="collabora-success">
          <h1>Messaggio inviato</h1>
          <p>Grazie per averci scritto. Ti risponderemo via email il prima possibile.</p>
          <p style={{ marginTop: '1.5rem' }}>
            <Link to="/">&larr; Torna alla home</Link>
          </p>
        </div>
      </main>
    )
  }

  return (
    <>
      <section className="collabora-intro container">
        <h1>Contattaci</h1>
        <p>Una domanda, una correzione o un ricordo da segnalare? Scrivici.</p>
      </section>

      <main className="container">
        <form className="collabora-form" onSubmit={onSubmit}>
          <input type="hidden" name="subject" value="Nuovo messaggio da 1968/1977 a Cesena" />
          <input type="hidden" name="from_name" value="Modulo contatti 68cesena.it" />
          {/* Honeypot anti-spam Web3Forms */}
          <input type="checkbox" name="botcheck" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nome">Nome</label>
              <input type="text" id="nome" name="nome" required autoComplete="name" />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" required autoComplete="email" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="commenti">Commenti</label>
            <textarea id="commenti" name="commenti" rows={6} required />
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn" disabled={sending}>
              {sending ? 'Invio in corso…' : 'Invia'}
            </button>
            <Link to="/" className="btn btn-secondary">Annulla</Link>
          </div>

          <p className="form-helper" style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            Oppure scrivi direttamente a <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
        </form>
      </main>
    </>
  )
}

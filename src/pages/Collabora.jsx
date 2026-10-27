import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Segmented from '../components/Segmented'
import SignaturePad from '../components/SignaturePad'

function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export default function Collabora() {
  const sigRef = useRef(null)
  const [files, setFiles] = useState([])
  const [docFiles, setDocFiles] = useState([])
  const [consent1, setConsent1] = useState(false)
  const [consent2, setConsent2] = useState(false)
  const [consent3, setConsent3] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const addFiles = (setter, list) => setter((prev) => [...prev, ...Array.from(list).map((f) => ({ file: f, id: `${f.name}-${f.size}-${Math.random()}` }))])
  const removeFile = (setter, id) => setter((prev) => prev.filter((x) => x.id !== id))

  const onSubmit = (e) => {
    e.preventDefault()
    setError(null)
    if (!consent1 || !consent2 || !consent3) {
      setError('Devi accettare tutte le dichiarazioni per inviare.')
      return
    }
    if (sigRef.current?.isEmpty()) {
      setError('La firma è obbligatoria.')
      return
    }
    // En el prototipo solo simulamos el envío. Cuando haya backend, aquí se
    // recoge el dataURL de la firma + ficheros + datos y se manda.
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (submitted) {
    return (
      <main className="container">
        <div className="collabora-success">
          <h1>Grazie</h1>
          <p>Abbiamo ricevuto la tua proposta di donazione. Ti contatteremo a breve via email per verificare l'identità e definire i passi successivi.</p>
          <p style={{ marginTop: '1.5rem' }}>
            <Link to="/">&larr; Torna alla home</Link>
          </p>
        </div>
      </main>
    )
  }

  const today = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <>
      <section className="collabora-intro container">
        <h1>Collabora con noi</h1>
        <p>
          Hai fotografie storiche o documenti relativi ai movimenti politici e alle lotte studentesche del periodo 1968-1977 a Cesena?
          Donale all'archivio per renderle accessibili a tutti, nel rispetto della tua identità di autore e dei diritti di copyright.
        </p>
      </section>

      <main className="container">
        <form className="collabora-form" onSubmit={onSubmit} autoComplete="on" noValidate>

          <section className="form-section">
            <h2 className="form-section-title"><span>Dati personali</span><span className="step">1 / 5</span></h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input type="text" id="nome" name="nome" required />
              </div>
              <div className="form-group">
                <label htmlFor="cognome">Cognome</label>
                <input type="text" id="cognome" name="cognome" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="codice-fiscale">Codice fiscale</label>
              <input type="text" id="codice-fiscale" name="codice_fiscale" maxLength={16} pattern="[A-Za-z0-9]{16}" required style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--serif)' }} />
              <p className="form-helper">16 caratteri — utilizzato per verificare l'identità con il documento allegato.</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" required />
              </div>
              <div className="form-group">
                <label>Telefono</label>
                <Segmented>
                  <input type="text" inputMode="numeric" className="seg-3" maxLength={3} placeholder="+39" aria-label="Prefisso" />
                  <input type="text" inputMode="numeric" className="seg-3" maxLength={3} placeholder="333" aria-label="Operatore" />
                  <input type="text" inputMode="numeric" maxLength={7} placeholder="1234567" aria-label="Numero" style={{ flex: 1 }} />
                </Segmented>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="indirizzo">Indirizzo di residenza</label>
              <input type="text" id="indirizzo" name="indirizzo" placeholder="Via, civico, CAP, città, provincia" />
            </div>
          </section>

          <section className="form-section">
            <h2 className="form-section-title"><span>Documento d'identità</span><span className="step">2 / 5</span></h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="doc-tipo">Tipo di documento</label>
                <select id="doc-tipo" name="doc_tipo" required>
                  <option value="">— Seleziona —</option>
                  <option value="carta-identita">Carta d'identità</option>
                  <option value="passaporto">Passaporto</option>
                  <option value="patente">Patente di guida</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="doc-numero">Numero documento</label>
                <input type="text" id="doc-numero" name="doc_numero" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="doc-rilasciato">Rilasciato da</label>
                <input type="text" id="doc-rilasciato" name="doc_rilasciato" placeholder="Comune di…" />
              </div>
              <div className="form-group">
                <label>Data di scadenza</label>
                <Segmented>
                  <input type="text" inputMode="numeric" className="seg-2" maxLength={2} placeholder="GG" aria-label="Giorno" />
                  <span className="seg-sep">/</span>
                  <input type="text" inputMode="numeric" className="seg-2" maxLength={2} placeholder="MM" aria-label="Mese" />
                  <span className="seg-sep">/</span>
                  <input type="text" inputMode="numeric" className="seg-4" maxLength={4} placeholder="AAAA" aria-label="Anno" />
                </Segmented>
              </div>
            </div>

            <div className="form-group">
              <label>Allegato — fronte e retro del documento</label>
              <label className="upload-area" htmlFor="doc-files">
                <span className="upload-area-icon">⤒</span>
                <span>Trascina qui i file o <u>scegli dal dispositivo</u></span>
                <input type="file" id="doc-files" accept="image/*,.pdf" multiple onChange={(e) => { addFiles(setDocFiles, e.target.files); e.target.value = '' }} />
              </label>
              {docFiles.length > 0 && (
                <ul className="upload-files-list">
                  {docFiles.map(({ id, file }) => (
                    <li key={id}>
                      <span>{file.name}<span className="file-meta">{formatBytes(file.size)}</span></span>
                      <button type="button" onClick={() => removeFile(setDocFiles, id)}>Rimuovi</button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="form-helper">Il documento è necessario per la verifica dell'identità. Viene conservato in modo cifrato e usato solo dal personale autorizzato.</p>
            </div>
          </section>

          <section className="form-section">
            <h2 className="form-section-title"><span>Materiale da donare</span><span className="step">3 / 5</span></h2>

            <div className="form-group">
              <label htmlFor="descrizione">Descrizione del materiale</label>
              <textarea id="descrizione" name="descrizione" placeholder="Es. 23 fotografie di mio nonno, fotografo a Forlì negli anni '50, ritratti di famiglia e manifestazioni politiche del dopoguerra…" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="periodo">Periodo (orientativo)</label>
                <input type="text" id="periodo" name="periodo" placeholder="es. 1945-1962" />
              </div>
              <div className="form-group">
                <label htmlFor="luoghi">Luoghi</label>
                <input type="text" id="luoghi" name="luoghi" placeholder="es. Forlì, Cesena…" />
              </div>
            </div>

            <div className="form-group">
              <label>Carica foto o documenti</label>
              <label className="upload-area" htmlFor="files">
                <span className="upload-area-icon">⤒</span>
                <span>Trascina i file o <u>scegli dal dispositivo</u> — formati JPG, PNG, TIFF, PDF</span>
                <input type="file" id="files" accept="image/*,.pdf,.tiff" multiple onChange={(e) => { addFiles(setFiles, e.target.files); e.target.value = '' }} />
              </label>
              {files.length > 0 && (
                <ul className="upload-files-list">
                  {files.map(({ id, file }) => (
                    <li key={id}>
                      <span>{file.name}<span className="file-meta">{formatBytes(file.size)}</span></span>
                      <button type="button" onClick={() => removeFile(setFiles, id)}>Rimuovi</button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="form-helper">Per donazioni di grandi dimensioni concorderemo la consegna via posta o di persona.</p>
            </div>
          </section>

          <section className="form-section">
            <h2 className="form-section-title"><span>Dichiarazione e cessione dei diritti</span><span className="step">4 / 5</span></h2>

            <div className="consent-text">
              <strong>Ai sensi della Legge 22 aprile 1941 n. 633 sul diritto d'autore</strong>
              <p>
                Il sottoscritto, in qualità di legittimo titolare delle fotografie e dei documenti allegati, <strong style={{ display: 'inline', fontSize: 'inherit', textTransform: 'none', letterSpacing: '0', margin: 0 }}>dichiara</strong> di avere acquisito tali materiali per via ereditaria, per acquisto o per produzione propria, e di avere il diritto di disporne.
              </p>
              <p>
                Con la firma in calce, <strong style={{ display: 'inline', fontSize: 'inherit', textTransform: 'none', letterSpacing: '0', margin: 0 }}>cede a titolo gratuito e non esclusivo</strong> all'Istituto Storico della Resistenza e dell'età contemporanea della provincia di Forlì-Cesena (di seguito "l'Istituto") tutti i diritti patrimoniali sulle opere (riproduzione, comunicazione al pubblico, distribuzione, esposizione, conservazione digitale) per finalità di studio, conservazione, ricerca storica e divulgazione culturale senza limiti di tempo e per il territorio mondiale.
              </p>
              <strong>Diritti morali</strong>
              <p>
                I diritti morali di autore, ai sensi degli artt. 20–24 della Legge 633/1941, rimangono in capo al sottoscritto o agli autori originari, in quanto inalienabili. L'Istituto si impegna a citare sempre l'autore e la provenienza in ogni utilizzo pubblico.
              </p>
              <strong>Garanzia di originalità</strong>
              <p>
                Il sottoscritto garantisce che il materiale è originale, che non viola diritti di terzi e tiene indenne l'Istituto da qualsiasi rivendicazione di terzi.
              </p>
              <strong>Trattamento dei dati personali (Reg. UE 2016/679 — GDPR)</strong>
              <p>
                I dati anagrafici e il documento d'identità sono trattati esclusivamente per verificare la titolarità della donazione e per gli adempimenti di legge. Conservazione: 10 anni. Titolare del trattamento: Istituto Storico della Resistenza FC. Hai diritto di accedere, rettificare e richiedere la cancellazione dei tuoi dati scrivendo a privacy@isrfc.it.
              </p>
            </div>

            <label className="checkbox-row">
              <input type="checkbox" checked={consent1} onChange={(e) => setConsent1(e.target.checked)} />
              <span>Dichiaro di essere titolare dei diritti sul materiale donato e che non violo diritti di terzi.</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={consent2} onChange={(e) => setConsent2(e.target.checked)} />
              <span>Cedo all'Istituto i diritti patrimoniali sulle opere come specificato sopra, mantenendo i diritti morali di autore.</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={consent3} onChange={(e) => setConsent3(e.target.checked)} />
              <span>Ho letto e accetto l'informativa sul trattamento dei dati personali (GDPR).</span>
            </label>
          </section>

          <section className="form-section">
            <h2 className="form-section-title"><span>Firma</span><span className="step">5 / 5</span></h2>

            <p className="form-helper" style={{ marginTop: 0, marginBottom: '1rem' }}>
              Apposta in data {today}. Tracciando la firma confermi tutte le dichiarazioni qui sopra.
            </p>

            <SignaturePad ref={sigRef} width={600} height={180} />

            <p className="form-helper" style={{ marginTop: '0.75rem' }}>
              La firma elettronica semplice è registrata insieme a data, ora, indirizzo IP e impronta del documento per costituire prova ai sensi del Reg. eIDAS UE 910/2014.
            </p>
          </section>

          {error && (
            <p style={{ color: 'var(--accent)', fontFamily: 'var(--serif)', fontStyle: 'italic', marginBottom: '1rem' }}>{error}</p>
          )}

          <div className="form-actions">
            <button type="submit" className="btn">Invia proposta di donazione</button>
            <Link to="/" className="btn btn-secondary">Annulla</Link>
          </div>
        </form>
      </main>
    </>
  )
}

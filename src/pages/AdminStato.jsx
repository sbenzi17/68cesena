import { useEffect, useState } from 'react'
import { supabase, loadStato } from '../lib/supabase'
import { getRecords, imageUrl, loadVisite, SQL_VISITE } from '../data/photos'

const oggiRoma = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - offset)
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' })
}

// Visite: numeri principali e grafico degli ultimi 30 giorni
function Visite() {
  const [dati, setDati] = useState(null)
  const [copiato, setCopiato] = useState(false)
  useEffect(() => { loadVisite().then(setDati) }, [])
  if (!dati) return <p className="muted-text">Caricamento delle visite…</p>
  if (dati.error) {
    return (
      <section className="admin-panel">
        <p>Per contare le visite va creata una piccola tabella nel database, una volta sola:
          su supabase.com apri il progetto → <strong>SQL Editor</strong> → <strong>+ New query</strong>,
          incolla il testo qui sotto, premi <strong>Run</strong> e ricarica questa pagina.
          Da quel momento il sito comincia a contare.</p>
        <pre className="stato-sql">{SQL_VISITE}</pre>
        <button type="button" className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(SQL_VISITE).then(() => setCopiato(true))}>
          {copiato ? 'Copiato' : 'Copia il testo'}
        </button>
      </section>
    )
  }
  const perGiorno = Object.fromEntries(dati.righe.map(r => [r.giorno, r.visite]))
  const somma = (giorni) => Array.from({ length: giorni }, (_, i) => perGiorno[oggiRoma(i)] || 0).reduce((a, b) => a + b, 0)
  const mese = oggiRoma().slice(0, 7)
  const ultimi30 = Array.from({ length: 30 }, (_, i) => oggiRoma(29 - i)).map(g => ({ g, n: perGiorno[g] || 0 }))
  const max = Math.max(1, ...ultimi30.map(d => d.n))
  return (
    <section className="admin-panel">
      <ul className="stato-numeri">
        <li><strong>{perGiorno[oggiRoma()] || 0}</strong> oggi</li>
        <li><strong>{perGiorno[oggiRoma(1)] || 0}</strong> ieri</li>
        <li><strong>{somma(7)}</strong> ultimi 7 giorni</li>
        <li><strong>{dati.righe.filter(r => r.giorno.startsWith(mese)).reduce((a, r) => a + r.visite, 0)}</strong> questo mese</li>
        <li><strong>{dati.righe.reduce((a, r) => a + r.visite, 0)}</strong> in tutto</li>
      </ul>
      <div className="stato-grafico" role="img" aria-label="Visite degli ultimi 30 giorni">
        {ultimi30.map(d => (
          <span key={d.g} style={{ height: `${(d.n / max) * 100}%` }} title={`${new Date(`${d.g}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}: ${d.n} visite`} />
        ))}
      </div>
      <p className="form-helper">Ultimi 30 giorni (passa il mouse su una colonna per il dettaglio). Una visita = una persona che apre il sito;
        non contano il pannello, l'anteprima e gli admin collegati. Senza cookie né dati personali.</p>
    </section>
  )
}

// Limiti dei piani gratuiti
const R2_LIMITE = 10 * 1024 ** 3 // 10 GB
const DB_LIMITE = 500 * 1024 ** 2 // 500 MB
const REPO = 'https://api.github.com/repos/sbenzi17/archivio-fotografico-isr-fc-react'

const SQL_DIMENSIONE = `create or replace function public.dimensione_database() returns bigint
language sql security definer stable set search_path = '' as $$
  select pg_database_size(current_database())
$$;
revoke all on function public.dimensione_database() from public, anon, authenticated;
grant execute on function public.dimensione_database() to service_role;`

const cartelle = { large: 'Immagini grandi', thumbs: 'Miniature', pdf: 'PDF', audio: 'Audio', config: 'Impostazioni (evento)' }

function size(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

const livello = (pct) => pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : 'ok'
const etichetta = { ok: 'Tutto bene', warn: 'Attenzione', danger: 'Vicino al limite' }

function Meter({ titolo, used, limit, children }) {
  const pct = Math.min(100, (used / limit) * 100)
  const l = livello(pct)
  return (
    <section className="admin-panel stato-meter">
      <div className="stato-meter-head">
        <h2>{titolo}</h2>
        <span className={`badge badge-${l === 'ok' ? 'ok' : l}`}>{etichetta[l]}</span>
      </div>
      <div className={`stato-bar stato-bar-${l}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
        <span style={{ width: `${Math.max(pct, 0.5)}%` }} />
      </div>
      <p className="stato-numbers"><strong>{pct < 1 ? pct.toFixed(2) : pct.toFixed(1)}%</strong> · {size(used)} su {size(limit)} gratuiti</p>
      {children}
    </section>
  )
}

function Check({ stato, children }) {
  const icon = { ok: '✓', warn: '!', danger: '✕', wait: '…' }[stato]
  return <li className={`stato-check stato-check-${stato}`}><span aria-hidden="true">{icon}</span> {children}</li>
}

const giorniFa = (iso) => Math.floor((Date.now() - Date.parse(iso)) / 86400000)
const quando = (iso) => new Date(iso).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })

export default function AdminStato() {
  const [dati, setDati] = useState(null)
  const [errore, setErrore] = useState('')
  const [storico, setStorico] = useState(null)
  const [db, setDb] = useState('wait')
  const [img, setImg] = useState('wait')
  const [ping, setPing] = useState(null)
  const [copiato, setCopiato] = useState(false)
  const [pingManuale, setPingManuale] = useState(null)

  // Ping manuale: una lettura dal database, come quella del ping automatico, che conta come attività
  const faiPing = async () => {
    setPingManuale({ stato: 'wait' })
    const inizio = performance.now()
    const { error } = await supabase.from('schede').select('id').limit(1)
    setPingManuale(error
      ? { stato: 'danger', testo: `Ping non riuscito: ${error.message}` }
      : { stato: 'ok', testo: `Ping riuscito alle ${new Date().toLocaleTimeString('it-IT')} (risposta in ${Math.round(performance.now() - inizio)} ms).` })
  }

  useEffect(() => {
    loadStato().then(setDati).catch(e => setErrore(e.message))
    supabase.from('schede').select('id', { count: 'exact', head: true })
      .then(({ error }) => setDb(error ? 'danger' : 'ok'))
    supabase.from('schede_storico').select('id', { count: 'exact', head: true })
      .then(({ count }) => setStorico(count))
    // le immagini si leggono dall'URL pubblico di R2: basta che una miniatura si carichi
    const prova = getRecords().find(r => r.immagini?.length)
    if (prova) {
      const im = new Image()
      im.onload = () => setImg('ok')
      im.onerror = () => setImg('danger')
      im.src = `${imageUrl(prova)}${imageUrl(prova).includes('?') ? '&' : '?'}t=${Date.now()}`
    }
    // ping anti-pausa (azione "keepalive" su GitHub): stato e ultima esecuzione
    Promise.all([
      fetch(`${REPO}/actions/workflows/keepalive.yml`).then(r => r.json()),
      fetch(`${REPO}/actions/workflows/keepalive.yml/runs?per_page=1`).then(r => r.json()),
    ]).then(([wf, runs]) => setPing({ attivo: wf.state === 'active', ultima: runs.workflow_runs?.[0] }))
      .catch(() => setPing({ errore: true }))
  }, [])

  const schede = getRecords()
  const pubblicate = schede.filter(r => (r.status || 'ok') === 'ok').length

  let pingStato = 'wait'
  let pingTesto = 'Controllo del ping automatico…'
  if (ping?.errore) { pingStato = 'warn'; pingTesto = 'Non riesco a leggere lo stato del ping da GitHub (riprova più tardi).' }
  else if (ping && !ping.attivo) { pingStato = 'danger'; pingTesto = 'Il ping automatico è DISATTIVATO su GitHub: riattivalo da Actions → keepalive → Enable workflow, altrimenti il database va in pausa dopo 7 giorni senza visite.' }
  else if (ping && !ping.ultima) { pingStato = 'warn'; pingTesto = 'Il ping automatico è attivo ma non è ancora mai stato eseguito da GitHub (gira ogni giorno verso le 7 del mattino).' }
  else if (ping) {
    const g = giorniFa(ping.ultima.created_at)
    const riuscito = ping.ultima.conclusion === 'success'
    pingStato = !riuscito ? 'danger' : g > 3 ? 'warn' : 'ok'
    pingTesto = `Ultimo ping automatico: ${quando(ping.ultima.created_at)} — ${riuscito ? 'riuscito' : `NON riuscito (${ping.ultima.conclusion || 'in corso'})`}.`
  }

  return (
    <main className="container">
      <div className="admin-toolbar">
        <h1>Stato dei servizi</h1>
      </div>

      {errore && <p className="form-error">Impossibile leggere lo spazio usato: {errore}</p>}

      <h2 className="stato-section">Visite</h2>
      <Visite />

      <h2 className="stato-section">Spazio usato</h2>
      {dati ? (
        <Meter titolo="Immagini e PDF (Cloudflare R2)" used={dati.r2.bytes} limit={R2_LIMITE}>
          <ul className="stato-list">
            {Object.entries(dati.r2.perCartella).map(([k, b]) => <li key={k}>{cartelle[k] || k}: {size(b)}</li>)}
            <li>{dati.r2.objects} file in tutto</li>
          </ul>
          <p className="form-helper">Oltre i 10 GB si paga 0,015 $ al mese per ogni GB in più (es. 20 GB ≈ 0,15 $/mese). Il sito non si ferma.</p>
        </Meter>
      ) : !errore && <p className="muted-text">Calcolo dello spazio su R2…</p>}

      {dati && (dati.db.bytes != null ? (
        <Meter titolo="Database (Supabase)" used={dati.db.bytes} limit={DB_LIMITE}>
          <p className="form-helper">
            Il database contiene solo i testi delle schede e lo storico: le immagini stanno su R2.
            Oltre i 500 MB Supabase avvisa e può mettere il database in sola lettura (il sito resta visibile ma non si salvano modifiche);
            si risolve eliminando righe dello storico o passando al piano Pro (25 $/mese).
          </p>
        </Meter>
      ) : (
        <section className="admin-panel">
          <h2>Database (Supabase)</h2>
          <p>Per vedere la dimensione del database va attivata una piccola funzione, una volta sola:</p>
          <ol className="stato-list">
            <li>Su supabase.com apri il progetto → <strong>SQL Editor</strong> → <strong>+ New query</strong>.</li>
            <li>Incolla il testo qui sotto e premi <strong>Run</strong>; poi ricarica questa pagina.</li>
          </ol>
          <pre className="stato-sql">{SQL_DIMENSIONE}</pre>
          <button type="button" className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(SQL_DIMENSIONE).then(() => setCopiato(true))}>
            {copiato ? 'Copiato' : 'Copia il testo'}
          </button>
        </section>
      ))}

      <h2 className="stato-section">Funzionamento</h2>
      <section className="admin-panel">
        <ul className="stato-checks">
          <Check stato={db}>Database: {db === 'ok' ? 'raggiungibile' : db === 'wait' ? 'controllo…' : 'NON raggiungibile'}</Check>
          <Check stato={img}>Immagini su R2: {img === 'ok' ? 'si caricano' : img === 'wait' ? 'controllo…' : 'NON si caricano'}</Check>
          <Check stato={errore ? 'danger' : dati ? 'ok' : 'wait'}>Worker dei caricamenti: {errore ? 'NON risponde' : dati ? 'risponde' : 'controllo…'}</Check>
          <Check stato={pingStato}>{pingTesto}</Check>
          {pingManuale && <Check stato={pingManuale.stato}>{pingManuale.testo || 'Ping in corso…'}</Check>}
        </ul>
        <p style={{ margin: '0.75rem 0' }}>
          <button type="button" className="btn" onClick={faiPing} disabled={pingManuale?.stato === 'wait'}>Fai un ping adesso</button>
        </p>
        <p className="form-helper">
          Il piano gratuito di Supabase mette in pausa il database dopo 7 giorni senza richieste: il ping automatico lo evita,
          e il pulsante fa la stessa cosa a mano. Conta come attività anche ogni visita al sito.
          Se andasse in pausa, il sito mostra «Archivio momentaneamente non disponibile»: si riattiva da supabase.com con <strong>Restore</strong>, senza perdere dati.
        </p>
      </section>

      <h2 className="stato-section">Contenuti</h2>
      <section className="admin-panel">
        <ul className="stato-list stato-columns">
          <li><strong>{schede.length}</strong> schede in tutto</li>
          <li><strong>{pubblicate}</strong> pubblicate, <strong>{schede.length - pubblicate}</strong> sospese</li>
          <li><strong>{schede.filter(r => r.immagini?.length).length}</strong> con immagine</li>
          <li><strong>{schede.filter(r => r.pdf).length}</strong> con PDF</li>
          <li><strong>{storico ?? '…'}</strong> righe nello storico</li>
        </ul>
      </section>

      <p className="form-helper">
        Non sono mostrati il traffico mensile di Supabase (5 GB gratuiti) e le operazioni su R2 (milioni gratuite al mese):
        con l'uso attuale siamo molto lontani da quei limiti, e in caso di superamento arrivano email di avviso.
      </p>
    </main>
  )
}

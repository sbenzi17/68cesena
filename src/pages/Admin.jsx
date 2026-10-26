import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { search, imageUrl, getRecords, exportCSV } from '../data/photos'

const PAGE = 50

function downloadExport() {
  const blob = new Blob([exportCSV()], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `catalogo-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function Admin() {
  const [q, setQ] = useState('')
  const [shown, setShown] = useState(PAGE)
  const total = useMemo(() => getRecords().length, [])
  const rows = useMemo(() => search(q).sort((a, b) => a.id.localeCompare(b.id)), [q])

  return (
    <main className="container">
      <div className="admin-toolbar">
        <h1>Fotografie</h1>
        <div>
          <button type="button" className="btn btn-secondary" onClick={downloadExport}>Esporta catalogo</button>
          &nbsp;
          <Link to="/admin/foto/nuova" className="btn">+ Nuova fotografia</Link>
        </div>
      </div>

      <p className="demo-note">
        Versione dimostrativa: le modifiche vengono salvate solo in questo browser.
      </p>

      <form style={{ marginBottom: '1.5rem' }} onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setShown(PAGE) }}
          placeholder="Cerca per titolo, autore, persona, identificativo…"
          style={{ width: '100%', padding: '0.6rem 0.8rem', border: '1px solid var(--border)', fontSize: '0.9rem' }}
        />
      </form>

      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>ID</th>
              <th>Titolo</th>
              <th>Serie</th>
              <th>Autore</th>
              <th>Data</th>
              <th>Luogo</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, shown).map((r) => {
              const src = imageUrl(r)
              return (
                <tr key={r.id}>
                  <td>
                    <span className={`table-img thumb-img bg-${(parseInt(r.id, 10) % 8) + 1}${src ? ' has-img' : ''}`} data-label="">
                      {src && <img src={src} alt="" loading="lazy" />}
                    </span>
                  </td>
                  <td>{r.id}</td>
                  <td>{r.titolo}</td>
                  <td>{r.serie}</td>
                  <td>{r.autore}</td>
                  <td>{r.dataOrd}</td>
                  <td>{r.citta}</td>
                  <td>
                    <Link to={`/admin/foto/${r.id}`} className="action">Modifica</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center' }}>
        Mostrando {Math.min(shown, rows.length)} di {rows.length} {q ? `(su ${total})` : ''} documenti
        {shown < rows.length && (
          <>
            {' · '}
            <a href="#" onClick={(e) => { e.preventDefault(); setShown(s => s + PAGE) }}>mostra altri</a>
          </>
        )}
      </p>
    </main>
  )
}

import { useState } from 'react'

const BASE = import.meta.env.BASE_URL

const pagine = [
  ['', 'Home'],
  ['risultati', "Tutto l'archivio"],
  ['indice?campo=formato', 'Formato'],
  ['indice?campo=autore', 'Autore'],
  ['contatto', 'Contattaci'],
  ['collabora', 'Collabora'],
]

// Il sito pubblico dentro il pannello, come lo vede un visitatore (senza le schede sospese)
export default function AdminAnteprima() {
  const [pagina, setPagina] = useState('')
  const [telefono, setTelefono] = useState(false)
  const [versione, setVersione] = useState(0) // cambia per ricaricare l'iframe

  return (
    <main className="anteprima">
      <div className="container anteprima-bar">
        <span className="muted-text">Il sito come lo vedono i visitatori</span>
        <select value={pagina} onChange={(e) => { setPagina(e.target.value); setVersione(v => v + 1) }} aria-label="Pagina">
          {pagine.map(([p, label]) => <option key={p} value={p}>{label}</option>)}
        </select>
        <button type="button" className="btn btn-secondary" onClick={() => setVersione(v => v + 1)}>↻ Ricarica</button>
        <button type="button" className="btn btn-secondary" onClick={() => setTelefono(t => !t)}>
          {telefono ? 'Vista computer' : 'Vista telefono'}
        </button>
      </div>
      <div className="anteprima-frame">
        <iframe
          key={versione}
          src={`${BASE}${pagina}`}
          title="Anteprima del sito"
          style={telefono ? { width: '390px' } : undefined}
        />
      </div>
    </main>
  )
}

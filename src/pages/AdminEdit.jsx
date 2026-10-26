import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPhotoDetail, imageUrl, saveRecord, nextId } from '../data/photos'

const empty = {
  titolo: '', autore: '', data: '', dataOrd: '', citta: '', luogo: '', evento: '',
  fondo: 'Fondo Maurizio Benzi', serie: 'Fotografie', tipologia: 'fotografia', status: 'ok',
  persone: [], formazione: [], parole: [], note: '', img: false,
}

const textFields = [
  ['titolo', 'Titolo'],
  ['autore', 'Autore'],
  ['data', 'Data'],
  ['dataOrd', 'Data per ordinamento (aaaa.mm.gg)'],
  ['citta', 'Città'],
  ['luogo', 'Luogo'],
  ['evento', 'Evento'],
  ['fondo', 'Fondo'],
  ['serie', 'Serie'],
]

const listFields = [
  ['persone', 'Persone (separate da virgola)'],
  ['formazione', 'Formazione politica'],
  ['parole', 'Parole chiave'],
]

// Riduce l'immagine nel browser: in produzione si caricherà nello storage
function resizeImage(file, maxSide = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(img.src)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function AdminEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'nuova'
  const original = isNew ? { ...empty, id: nextId() } : getPhotoDetail(id)
  const [preview, setPreview] = useState(original ? imageUrl(original, 'large') : null)
  const [imgData, setImgData] = useState(original?.imgData || null)

  if (!original) {
    return <main className="container"><p>Scheda non trovata. <Link to="/admin">Indietro</Link></p></main>
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const data = await resizeImage(file)
    setImgData(data)
    setPreview(data)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const record = { ...original }
    for (const [k] of textFields) record[k] = (form.get(k) || '').trim()
    for (const [k] of listFields) record[k] = (form.get(k) || '').split(',').map(s => s.trim()).filter(Boolean)
    record.note = (form.get('note') || '').trim()
    if (imgData) record.imgData = imgData
    saveRecord(record)
    navigate(`/foto/${record.id}`)
  }

  return (
    <main className="container">
      <div className="admin-toolbar">
        <h1>{isNew ? `Nuova fotografia · ${original.id}` : `Modifica fotografia · ${original.id}`}</h1>
        <Link to="/admin" className="btn btn-secondary">&larr; Indietro</Link>
      </div>

      <p className="demo-note">
        Versione dimostrativa: le modifiche vengono salvate solo in questo browser.
      </p>

      <form className="detail" onSubmit={onSubmit}>
        <div>
          <div
            className={`detail-img thumb-img bg-${(parseInt(original.id, 10) % 8) + 1}${preview ? ' has-img' : ''}`}
            data-label={preview ? '' : 'Nessuna immagine'}
          >
            {preview && <img src={preview} alt="" />}
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="file">{preview ? 'Sostituisci immagine' : 'Carica immagine'}</label>
            <input type="file" id="file" accept="image/*" onChange={onFile} />
          </div>
        </div>

        <div className="detail-meta">
          {textFields.map(([k, label]) => (
            <div className="form-group" key={k}>
              <label htmlFor={k}>{label}</label>
              <input type="text" id={k} name={k} defaultValue={original[k]} />
            </div>
          ))}

          {listFields.map(([k, label]) => (
            <div className="form-group" key={k}>
              <label htmlFor={k}>{label}</label>
              <input type="text" id={k} name={k} defaultValue={(original[k] || []).join(', ')} />
            </div>
          ))}

          <div className="form-group">
            <label htmlFor="note">Note</label>
            <textarea id="note" name="note" rows={4} defaultValue={original.note} />
          </div>

          <button type="submit" className="btn">Salva modifiche</button>
          &nbsp;
          <Link to="/admin" className="btn btn-secondary">Annulla</Link>
        </div>
      </form>
    </main>
  )
}

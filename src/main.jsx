import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { loadCatalogo } from './data/photos'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(<p className="app-loading">Caricamento dell'archivio…</p>)

loadCatalogo()
  .then(() => root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  ))
  .catch((e) => {
    console.error(e)
    root.render(<p className="app-loading">Archivio momentaneamente non disponibile. Riprova più tardi.</p>)
  })

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import PublicLayout from './components/PublicLayout'
import AuthLayout from './components/AuthLayout'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import Indice from './pages/Indice'
import Risultati from './pages/Risultati'
import Dettaglio from './pages/Dettaglio'
import Login from './pages/Login'
import Admin from './pages/Admin'
import AdminEdit from './pages/AdminEdit'
import AdminStorico from './pages/AdminStorico'
import AdminUtenti from './pages/AdminUtenti'
import AdminStato from './pages/AdminStato'
import AdminEvento from './pages/AdminEvento'
import Collabora from './pages/Collabora'
import Contatto from './pages/Contatto'
import './App.css'

// Ogni salvataggio naviga di nuovo sulla scheda: la chiave nuova ricrea il modulo con i dati appena salvati
function AdminEditPage() {
  return <AdminEdit key={useLocation().key} />
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/indice" element={<Indice />} />
          <Route path="/risultati" element={<Risultati />} />
          <Route path="/foto/:id" element={<Dettaglio />} />
          <Route path="/collabora" element={<Collabora />} />
          <Route path="/contatto" element={<Contatto />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/foto/:id" element={<AdminEditPage />} />
          <Route path="/admin/storico" element={<AdminStorico />} />
          <Route path="/admin/utenti" element={<AdminUtenti />} />
          <Route path="/admin/stato" element={<AdminStato />} />
          <Route path="/admin/evento" element={<AdminEvento />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

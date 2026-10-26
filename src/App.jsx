import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import PublicLayout from './components/PublicLayout'
import AuthLayout from './components/AuthLayout'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import Indice from './pages/Indice'
import Risultati from './pages/Risultati'
import Dettaglio from './pages/Dettaglio'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Admin from './pages/Admin'
import AdminEdit from './pages/AdminEdit'
import Collabora from './pages/Collabora'
import Contatto from './pages/Contatto'
import './App.css'

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
          <Route path="/registro" element={<Registro />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/foto/:id" element={<AdminEdit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

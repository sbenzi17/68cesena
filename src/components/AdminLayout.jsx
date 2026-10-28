import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import AdminHeader from './AdminHeader'
import { isAdmin } from '../lib/supabase'
import { usePageMeta } from '../lib/meta'

export default function AdminLayout() {
  const [allowed, setAllowed] = useState(null)
  usePageMeta('Pannello di amministrazione', null, { noindex: true })

  useEffect(() => {
    isAdmin().then(setAllowed)
  }, [])

  if (allowed === null) return <p className="app-loading">Verifica dell'accesso…</p>
  if (!allowed) return <Navigate to="/login" replace />

  return (
    <>
      <AdminHeader />
      <Outlet />
    </>
  )
}

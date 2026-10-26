import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import AdminHeader from './AdminHeader'
import { isAdmin } from '../lib/supabase'

export default function AdminLayout() {
  const [allowed, setAllowed] = useState(null)

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

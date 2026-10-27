import { Outlet } from 'react-router-dom'
import Brand from './Brand'

export default function AuthLayout() {
  return (
    <>
      <header className="site-header">
        <div className="container">
          <Brand />
        </div>
      </header>
      <Outlet />
    </>
  )
}

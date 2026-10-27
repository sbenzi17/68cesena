import { Outlet } from 'react-router-dom'
import Header from './Header'
import Navigation from './Navigation'
import Footer from './Footer'

export default function PublicLayout() {
  return (
    <>
      {/* Header e menu restano fissi in alto durante lo scorrimento */}
      <div className="site-top">
        <Header />
        <Navigation />
      </div>
      <Outlet />
      <Footer />
    </>
  )
}

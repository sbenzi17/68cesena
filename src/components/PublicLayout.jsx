import { Outlet } from 'react-router-dom'
import Header from './Header'
import Navigation from './Navigation'
import Footer from './Footer'

export default function PublicLayout() {
  return (
    <>
      {/* primo elemento raggiungibile con il tasto Tab: porta direttamente al contenuto */}
      <a href="#contenuto" className="skip-link">Salta al contenuto</a>
      {/* Header e menu restano fissi in alto durante lo scorrimento */}
      <div className="site-top">
        <Header />
        <Navigation />
      </div>
      <div id="contenuto" tabIndex={-1}>
        <Outlet />
      </div>
      <Footer />
    </>
  )
}

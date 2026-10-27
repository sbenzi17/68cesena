import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Navigation from './Navigation'
import Footer from './Footer'

export default function PublicLayout() {
  // Header e menu restano fissi in alto; scorrendo l'header si compatta
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <div className={`site-top${scrolled ? ' scrolled' : ''}`}>
        <Header />
        <Navigation />
      </div>
      <Outlet />
      <Footer />
    </>
  )
}

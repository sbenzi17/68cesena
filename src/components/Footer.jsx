import { Link } from 'react-router-dom'
import { getTestoFooter } from '../data/photos'

export default function Footer() {
  const testo = getTestoFooter()
  return (
    <footer className="site-footer">
      <div className="container">
        {/* testo libero, modificabile dal pannello (voce "Testi") */}
        {testo && <p className="footer-testo">{testo}</p>}
        <nav className="footer-links" aria-label="Link secondari">
          <Link to="/contatto">Contattaci</Link>
          <span aria-hidden="true">·</span>
          <Link to="/login" className="footer-login">Area riservata</Link>
        </nav>
      </div>
    </footer>
  )
}

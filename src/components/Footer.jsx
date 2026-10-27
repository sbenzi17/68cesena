import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <nav className="footer-links" aria-label="Link secondari">
          <Link to="/collabora">Collabora</Link>
          <span aria-hidden="true">·</span>
          <Link to="/contatto">Contattaci</Link>
          <span aria-hidden="true">·</span>
          <Link to="/login" className="footer-login">Area riservata</Link>
        </nav>
      </div>
    </footer>
  )
}

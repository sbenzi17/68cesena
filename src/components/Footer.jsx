import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <section className="footer-partners" aria-label="Collaborazioni">
          <p className="footer-partners-title">In cerca di collaborazioni con</p>
          <div className="footer-partners-logos">
            <div className="partner-logo">
              <img src={`${import.meta.env.BASE_URL}logos/comune-cesena.gif`} alt="Comune di Cesena" />
              <span className="partner-logo-name">Comune di Cesena</span>
            </div>
            <div className="partner-logo">
              <img src={`${import.meta.env.BASE_URL}logos/biblioteca-malatestiana.png`} alt="Biblioteca Malatestiana" />
              <span className="partner-logo-name">Biblioteca Malatestiana</span>
            </div>
          </div>
          <p className="footer-partners-note">Progetto in fase di sviluppo — partnership ancora da formalizzare</p>
        </section>

        <nav className="footer-links" aria-label="Link secondari">
          <Link to="/collabora">Collabora con noi</Link>
          <span aria-hidden="true">·</span>
          <Link to="/contatto">Contatti</Link>
          <span aria-hidden="true">·</span>
          <Link to="/login">Area riservata</Link>
        </nav>

        <div className="footer-credits">
          Istituto Storico della Resistenza e dell'età contemporanea della provincia di Forlì-Cesena
        </div>
      </div>
    </footer>
  )
}

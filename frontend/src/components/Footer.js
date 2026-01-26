import React from 'react';
import '../styles/Footer.css';

const Footer = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>ASAA Platform</h4>
          <p>La formation est notre priorité</p>
        </div>

        <div className="footer-section">
          <h4>Accès rapide</h4>
          <ul>
            <li>
              <button type="button" className="footer-link" onClick={() => onNavigate?.('home')}>
                Accueil
              </button>
            </li>
            <li>
              <button type="button" className="footer-link" onClick={() => onNavigate?.('quiz')}>
                Quiz
              </button>
            </li>
            <li>
              <button type="button" className="footer-link" onClick={() => onNavigate?.('events')}>
                Événements
              </button>
            </li>
            <li>
              <button type="button" className="footer-link" onClick={() => onNavigate?.('governance')}>
                Gouvernance
              </button>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>À propos</h4>
          <ul>
            <li>
              <button type="button" className="footer-link" onClick={() => onNavigate?.('home', 'about')}>
                À propos de nous
              </button>
            </li>
            <li>
              <button type="button" className="footer-link" onClick={() => onNavigate?.('home', 'contact')}>
                Contact
              </button>
            </li>
            <li>
              <button type="button" className="footer-link" onClick={() => onNavigate?.('home', 'privacy')}>
                Politique de confidentialité
              </button>
            </li>
            <li>
              <button type="button" className="footer-link" onClick={() => onNavigate?.('home', 'terms')}>
                Conditions d'utilisation
              </button>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Nous suivre</h4>
          <div className="social-links">
            <a href="#facebook" title="Facebook">f</a>
            <a href="#twitter" title="Twitter">𝕏</a>
            <a href="#linkedin" title="LinkedIn">in</a>
            <a href="#instagram" title="Instagram">📷</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {currentYear} <strong>LMO CORP</strong> | <em>La formation est notre priorité</em></p>
        <p className="footer-version">ASAA Platform v2.0</p>
      </div>
    </footer>
  );
};

export default Footer;

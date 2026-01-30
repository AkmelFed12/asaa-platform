import React from 'react';
import '../styles/Footer.css';

const Footer = ({ onNavigate, mode = 'member' }) => {
  const currentYear = new Date().getFullYear();
  const quickLinks = mode === 'public'
    ? [
        { label: 'Accueil', page: 'home' },
        { label: 'Quiz', page: 'quiz' },
        { label: 'Gouvernance', page: 'governance' },
        { label: 'Dons', page: 'donations' }
      ]
    : [
        { label: 'Accueil', page: 'home' },
        { label: 'Quiz', page: 'quiz' },
        { label: 'Événements', page: 'events' },
        { label: 'Actualités', page: 'news' },
        { label: 'Gouvernance', page: 'governance' },
        { label: 'Dons', page: 'donations' }
      ];

  const aboutLinks = mode === 'public'
    ? [
        { label: 'À propos de nous', page: 'about' }
      ]
    : [
        { label: 'À propos de nous', page: 'about' },
        { label: 'Nos activites', page: 'activities' },
        { label: 'Contact', page: 'contact' },
        { label: 'Politique de confidentialité', page: 'privacy' },
        { label: 'Conditions d\'utilisation', page: 'terms' },
        { label: 'FAQ', page: 'faq' }
      ];

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
            {quickLinks.map((link) => (
              <li key={link.page}>
                <button type="button" className="footer-link" onClick={() => onNavigate?.(link.page)}>
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-section">
          <h4>À propos</h4>
          <ul>
            {aboutLinks.map((link) => (
              <li key={link.page}>
                <button type="button" className="footer-link" onClick={() => onNavigate?.(link.page)}>
                  {link.label}
                </button>
              </li>
            ))}
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
          <p>Contacts: 0574724233 · 0705583082 · 0779382233 · 0151495971</p>
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

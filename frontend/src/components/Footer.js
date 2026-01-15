import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
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
            <li><a href="/">Accueil</a></li>
            <li><a href="#quiz">Quiz</a></li>
            <li><a href="#events">Événements</a></li>
            <li><a href="#governance">Gouvernance</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>À propos</h4>
          <ul>
            <li><a href="#about">À propos de nous</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><a href="#privacy">Politique de confidentialité</a></li>
            <li><a href="#terms">Conditions d'utilisation</a></li>
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

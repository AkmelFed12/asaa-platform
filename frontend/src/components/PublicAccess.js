import React, { useEffect, useState } from 'react';
import Governance from './Governance';
import QuizNew from './QuizNew';
import Donations from './Donations';
import AboutSection from './AboutSection';
import Footer from './Footer';

function PublicAccess({ onLoginClick }) {
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('tx_ref')
      || params.get('transaction_id')
      || params.get('status')
      || params.get('donation')
      || params.get('token')
      || params.get('invoice_token')
      || params.get('paydunya_token')
    ) {
      setCurrentPage('donations');
    }
  }, []);

  const handleNavigate = (page, anchorId) => {
    setCurrentPage(page);
    if (!anchorId) {
      return;
    }
    setTimeout(() => {
      const target = document.getElementById(anchorId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  };

  return (
    <div className="App public-view">
      <header className="App-header public-header">
        <div className="header-content">
          <h1>ASAA - Association des Serviteurs d'Allah Azawajal</h1>
          <p>Acces public : quiz, gouvernance, dons et presentation</p>
        </div>
        <div className="user-info">
          <span>Acces invite</span>
          <button type="button" className="login-btn" onClick={onLoginClick}>
            Se connecter
          </button>
        </div>
      </header>

      <nav className="App-nav">
        <button
          className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentPage('home')}
        >
          Accueil
        </button>
        <button
          className={`nav-btn ${currentPage === 'quiz' ? 'active' : ''}`}
          onClick={() => setCurrentPage('quiz')}
        >
          Quiz Quotidien
        </button>
        <button
          className={`nav-btn ${currentPage === 'governance' ? 'active' : ''}`}
          onClick={() => setCurrentPage('governance')}
        >
          Gouvernance
        </button>
        <button
          className={`nav-btn ${currentPage === 'donations' ? 'active' : ''}`}
          onClick={() => setCurrentPage('donations')}
        >
          Dons
        </button>
        <button
          className={`nav-btn ${currentPage === 'about' ? 'active' : ''}`}
          onClick={() => setCurrentPage('about')}
        >
          A propos
        </button>
      </nav>

      <main className="App-main">
        {currentPage === 'home' && (
          <>
            <section className="welcome-section home-hero public-hero">
              <h2>Bienvenue sur l'espace public</h2>
              <p>Participez au quiz et decouvrez la gouvernance de l'association.</p>
              <div className="public-actions">
                <button type="button" className="home-action-btn" onClick={() => setCurrentPage('quiz')}>
                  Lancer le quiz
                </button>
                <button type="button" className="home-action-btn" onClick={() => setCurrentPage('donations')}>
                  Faire un don
                </button>
              </div>
            </section>

            <section className="home-grid">
              <div className="home-card">
                <h3>Quiz Islamique</h3>
                <p>20 questions chaque jour pour tester vos connaissances.</p>
                <button type="button" className="home-action-btn" onClick={() => setCurrentPage('quiz')}>
                  Participer
                </button>
              </div>
              <div className="home-card">
                <h3>Gouvernance</h3>
                <p>Decouvrez les responsables et la structure de l'ASAA.</p>
                <button type="button" className="home-action-btn" onClick={() => setCurrentPage('governance')}>
                  Voir la gouvernance
                </button>
              </div>
              <div className="home-card">
                <h3>Dons</h3>
                <p>Soutenez les actions sociales, educatives et spirituelles.</p>
                <button type="button" className="home-action-btn" onClick={() => setCurrentPage('donations')}>
                  Soutenir l'ASAA
                </button>
              </div>
              <div className="home-card">
                <h3>A propos</h3>
                <p>Notre mission et nos valeurs pour la communaute.</p>
                <button type="button" className="home-action-btn" onClick={() => setCurrentPage('about')}>
                  En savoir plus
                </button>
              </div>
            </section>
          </>
        )}

        {currentPage === 'quiz' && <QuizNew />}
        {currentPage === 'governance' && <Governance isAdmin={false} />}
        {currentPage === 'donations' && <Donations />}
        {currentPage === 'about' && <AboutSection onBack={() => setCurrentPage('home')} />}
      </main>

      <Footer onNavigate={handleNavigate} mode="public" />
    </div>
  );
}

export default PublicAccess;

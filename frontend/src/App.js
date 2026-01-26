import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth';
import Governance from './components/Governance';
import MemberProfile from './components/MemberProfile';
import Quiz from './components/Quiz';
import QuizNew from './components/QuizNew';
import Events from './components/Events';
import Admin from './components/Admin';
import Footer from './components/Footer';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = ({ user: userData, token }) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('token', token);
    }
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentPage('home');
  };

  // Show authentication page if not logged in
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const handleNavigate = (page, anchorId) => {
    setCurrentPage(page);
    if (!anchorId) return;
    setTimeout(() => {
      const target = document.getElementById(anchorId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>ASAA - Association des Serviteurs d'Allah Azawajal</h1>
          <p>Plateforme de gestion et de coordination</p>
        </div>
        <div className="user-info">
          <span>Connecté: {user.first_name} {user.last_name} ({user.role})</span>
          <button className="logout-btn" onClick={handleLogout}>Déconnexion</button>
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
          📚 Quiz Quotidien
        </button>
        <button 
          className={`nav-btn ${currentPage === 'events' ? 'active' : ''}`}
          onClick={() => setCurrentPage('events')}
        >
          📅 Événements
        </button>
        <button 
          className={`nav-btn ${currentPage === 'governance' ? 'active' : ''}`}
          onClick={() => setCurrentPage('governance')}
        >
          Gouvernance
        </button>
        <button
          className={`nav-btn ${currentPage === 'profile' ? 'active' : ''}`}
          onClick={() => setCurrentPage('profile')}
        >
          👤 Profil
        </button>
        {user.role === 'admin' && (
          <button 
            className={`nav-btn admin-btn ${currentPage === 'admin' ? 'active' : ''}`}
            onClick={() => setCurrentPage('admin')}
          >
            🔧 Admin
          </button>
        )}
      </nav>

      <main className="App-main">
        {currentPage === 'home' && (
          <>
            <section className="welcome-section">
              <h2>Bienvenue sur ASAA</h2>
              <p>Association des Serviteurs d'Allah Azawajal</p>
              <p>Plateforme de gestion, coordination et apprentissage islamique</p>
            </section>

            <section className="features-section">
              <h2>Fonctionnalités Disponibles</h2>
              <div className="features-grid">
                <div className="feature-card">
                  <h3>📋 Gouvernance</h3>
                  <p>Consultez la structure organisationnelle et les responsables</p>
                </div>
                <div className="feature-card">
                  <h3>📚 Quiz Islamique</h3>
                  <p>Testez vos connaissances avec 20 questions chronométrées</p>
                </div>
                {user.role === 'admin' && (
                  <div className="feature-card">
                    <h3>🔧 Administration</h3>
                    <p>Gérez les positions et les paramètres du système</p>
                  </div>
                )}
              </div>
            </section>

            <section className="status-section" id="about">
              <h2>À propos de nous</h2>
              <p>ASAA soutient la formation et l'organisation communautaire à travers des outils simples et efficaces.</p>
            </section>

            <section className="status-section" id="contact">
              <h2>Contact</h2>
              <p>Pour toute demande, contactez l'administration via votre responsable local.</p>
            </section>

            <section className="status-section" id="privacy">
              <h2>Politique de confidentialité</h2>
              <p>Nous protégeons les données des membres et n'utilisons pas vos informations à des fins commerciales.</p>
            </section>

            <section className="status-section" id="terms">
              <h2>Conditions d'utilisation</h2>
              <p>L'utilisation de la plateforme implique le respect des règles et la bonne conduite en communauté.</p>
            </section>
          </>
        )}

        {currentPage === 'governance' && (
          <Governance isAdmin={user.role === 'admin'} />
        )}

        {currentPage === 'profile' && (
          <MemberProfile user={user} />
        )}

        {currentPage === 'quiz' && (
          <QuizNew user={user} />
        )}

        {currentPage === 'events' && (
          <Events isAdmin={user.role === 'admin'} />
        )}

        {currentPage === 'admin' && user.role === 'admin' && (
          <Admin isAdmin={true} />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;

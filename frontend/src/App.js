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
              <h2>ASAA - Association des Serviteurs d'Allah Azawajal</h2>
              <p><strong>Valeurs fondamentales:</strong> Respect - Tolerance - Pardon</p>
              <p>
                L'Association des Serviteurs d'Allah Azawajal (ASAA) est une organisation a vocation religieuse, sociale
                et educative, engagee dans la promotion des valeurs islamiques authentiques et du vivre-ensemble
                harmonieux. Elle oeuvre pour le renforcement de la foi, de la fraternite et de la solidarite entre ses
                membres et au sein de la communaute.
              </p>
              <p>
                Guidee par les principes de respect, de tolerance et de pardon, l'ASAA place l'etre humain au coeur de
                son action, en favorisant une pratique de l'Islam basee sur la connaissance, l'ethique et la
                responsabilite sociale.
              </p>
              <h3>Notre mission</h3>
              <ul>
                <li>Renforcer la cohesion fraternelle entre les membres</li>
                <li>Encourager l'apprentissage et la transmission des enseignements islamiques</li>
                <li>Sensibiliser la jeunesse aux valeurs morales et spirituelles de l'Islam</li>
                <li>Contribuer activement au bien-etre social a travers des actions solidaires</li>
              </ul>
            </section>

            <section className="status-section" id="contact">
              <h2>Contact</h2>
              <p>Pour toute demande, contactez l'administration via votre responsable local.</p>
            </section>

            <section className="status-section" id="privacy">
              <h2>Politique de confidentialite</h2>
              <p>Nous protegens les donnees des membres et n'utilisons pas vos informations a des fins commerciales.</p>
            </section>

            <section className="status-section" id="terms">
              <h2>Conditions d'utilisation</h2>
              <p>L'utilisation de la plateforme implique le respect des regles et la bonne conduite en communaute.</p>
            </section>

            <section className="status-section" id="activities">
              <h2>Nos activites - Annee 2026</h2>
              <h3>1. Activites ponctuelles</h3>
              <ul>
                <li><strong>Janvier:</strong> Sortie detente du Bureau - rencontre fraternelle pour renforcer la cohesion interne.</li>
                <li><strong>Fevrier:</strong> Rupture collective - moment de partage reunissant l'ensemble des membres.</li>
                <li><strong>Mars:</strong> Match de gala et lancement du Quiz Islamique 2026 - fraternite et ouverture des preselections.</li>
                <li><strong>Juillet:</strong> Cloture des preselections - selection des candidats pour la grande finale.</li>
                <li><strong>Aout:</strong> Grande finale du Quiz Islamique - evenement phare de l'annee.</li>
                <li><strong>Septembre:</strong> Actions sociales et recueillement - Ziara et visites solidaires aux malades.</li>
                <li><strong>Decembre:</strong> Conference de fin d'annee - sensibilisation sur les derives des festivites.</li>
              </ul>
              <h3>2. Activites permanentes</h3>
              <ul>
                <li><strong>Le Grin Religieux:</strong> rencontre hebdomadaire chaque dimanche, apprentissage et echange.</li>
                <li><strong>Rencontres tournantes:</strong> reunions chez les membres pour renforcer les liens familiaux.</li>
                <li><strong>Echanges et formations:</strong> causeries, debats et enseignements islamiques reguliers.</li>
              </ul>
              <h3>Notre engagement</h3>
              <p>
                A travers ses actions, l'ASAA s'engage a etre un cadre de reference pour l'education spirituelle, la
                solidarite et l'epanouissement moral de ses membres, dans le respect des valeurs islamiques et humaines.
              </p>
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

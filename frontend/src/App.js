import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth';
import Governance from './components/Governance';
import Quiz from './components/Quiz';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCurrentPage('home');
  };

  // Show authentication page if not logged in
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

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
          className={`nav-btn ${currentPage === 'governance' ? 'active' : ''}`}
          onClick={() => setCurrentPage('governance')}
        >
          Structure de Gouvernance
        </button>
        <button 
          className={`nav-btn ${currentPage === 'quiz' ? 'active' : ''}`}
          onClick={() => setCurrentPage('quiz')}
        >
          Quiz Islamique
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
          </>
        )}

        {currentPage === 'governance' && (
          <Governance isAdmin={user.role === 'admin'} />
        )}

        {currentPage === 'quiz' && (
          <Quiz userId={user.id} />
        )}

        {currentPage === 'admin' && user.role === 'admin' && (
          <section className="admin-section">
            <h2>Panneau d'Administration</h2>
            <p>Bienvenue administrateur {user.first_name}!</p>
            <div className="admin-options">
              <button onClick={() => setCurrentPage('governance')} className="admin-option-btn">
                ➜ Gérer la Gouvernance
              </button>
              <button className="admin-option-btn" disabled>
                ➜ Gérer les Utilisateurs (À venir)
              </button>
              <button className="admin-option-btn" disabled>
                ➜ Consulter les Rapports (À venir)
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="App-footer">
        <p>&copy; 2024 ASAA - Association des Serviteurs d'Allah Azawajal. Tous droits réservés.</p>
      </footer>
    </div>
  );
}

export default App;

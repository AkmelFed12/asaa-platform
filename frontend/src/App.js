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
            <section className="welcome-section home-hero">
              <h2>Bienvenue sur ASAA</h2>
              <p>Association des Serviteurs d'Allah Azawajal</p>
            </section>

            <section className="home-grid">
              <div className="home-card">
                <h3>👤 Membres</h3>
                <p>Accedez a votre profil et aux informations des membres.</p>
                <button type="button" className="home-action-btn" onClick={() => setCurrentPage('profile')}>
                  Voir les membres
                </button>
              </div>
              <div className="home-card">
                <h3>📋 Gouvernance</h3>
                <p>Consultez la structure organisationnelle et les responsables.</p>
                <button type="button" className="home-action-btn" onClick={() => setCurrentPage('governance')}>
                  Voir la gouvernance
                </button>
              </div>
            </section>
          </>
        )}

        {currentPage === 'about' && (
          <section className="status-section">
            <h2>ASAA - Association des Serviteurs d'Allah Azawajal</h2>
            <p><strong>Valeurs fondamentales:</strong> Respect - Tolerance - Pardon</p>
            <p>
              L'Association des Serviteurs d'Allah Azawajal (ASAA) est une organisation a vocation religieuse, sociale
              et educative, engagee dans la promotion des valeurs islamiques authentiques et du vivre-ensemble
              harmonieux. Elle oeuvre pour le renforcement de la foi, de la fraternite et de la solidarite entre ses
              membres et au sein de la communaute.
            </p>
            <p>
              Guidee par les principes de respect, de tolerance et de pardon, l'ASAA place l'etre humain au coeur de son
              action, en favorisant une pratique de l'Islam basee sur la connaissance, l'ethique et la responsabilite
              sociale.
            </p>
            <h3>Notre mission</h3>
            <ul>
              <li>Renforcer la cohesion fraternelle entre les membres</li>
              <li>Encourager l'apprentissage et la transmission des enseignements islamiques</li>
              <li>Sensibiliser la jeunesse aux valeurs morales et spirituelles de l'Islam</li>
              <li>Contribuer activement au bien-etre social a travers des actions solidaires</li>
            </ul>
            <button type="button" className="home-action-btn" onClick={() => setCurrentPage('home')}>
              Retour a l'accueil
            </button>
          </section>
        )}

        {currentPage === 'contact' && (
          <section className="status-section">
            <h2>Contact</h2>
            <p>Pour toute demande, contactez l'administration via votre responsable local.</p>
            <button type="button" className="home-action-btn" onClick={() => setCurrentPage('home')}>
              Retour a l'accueil
            </button>
          </section>
        )}

        {currentPage === 'privacy' && (
          <section className="status-section">
            <h2>Politique de confidentialite</h2>
            <p>
              La presente politique de confidentialite decrit la maniere dont l'Association des Serviteurs d'Allah
              Azawajal (ASAA) collecte, utilise, protege et traite les donnees personnelles des utilisateurs du site.
            </p>
            <p>En utilisant ce site, vous acceptez les pratiques decrites dans la presente politique.</p>
            <h3>1. Responsable du traitement des donnees</h3>
            <p>
              Le responsable du traitement des donnees personnelles est : ASAA - Association des Serviteurs d'Allah
              Azawajal, organisation a caractere religieux, educatif et social.
            </p>
            <h3>2. Donnees personnelles collectees</h3>
            <ul>
              <li>Nom et prenom</li>
              <li>Adresse e-mail</li>
              <li>Numero de telephone</li>
              <li>Informations transmises via les formulaires de contact ou d'inscription</li>
            </ul>
            <p>Aucune donnee personnelle n'est collectee a votre insu.</p>
            <h3>3. Finalites de la collecte</h3>
            <ul>
              <li>Repondre aux demandes envoyees via le site</li>
              <li>Gerer les inscriptions aux activites et evenements</li>
              <li>Informer les membres des actions et communications de l'ASAA</li>
              <li>Ameliorer le fonctionnement et le contenu du site</li>
            </ul>
            <h3>4. Confidentialite et partage</h3>
            <ul>
              <li>Les donnees ne sont ni vendues, ni louees, ni cedées a des tiers</li>
              <li>Partage possible uniquement avec les responsables internes, pour les finalites ci-dessus</li>
            </ul>
            <h3>5. Securite des donnees</h3>
            <p>
              L'ASAA met en oeuvre des mesures techniques et organisationnelles pour proteger les donnees contre la
              perte, l'acces non autorise, la divulgation ou la modification abusive.
            </p>
            <h3>6. Duree de conservation</h3>
            <p>
              Les donnees personnelles sont conservees uniquement pendant la duree necessaire aux objectifs pour
              lesquels elles ont ete collectees, sauf obligation legale contraire.
            </p>
            <h3>7. Droits des utilisateurs</h3>
            <ul>
              <li>Droit d'acces a ses donnees</li>
              <li>Droit de rectification des donnees inexactes</li>
              <li>Droit de suppression</li>
              <li>Droit d'opposition a l'utilisation</li>
            </ul>
            <p>
              Toute demande relative a ces droits peut etre adressee a l'ASAA via les moyens de contact du site.
            </p>
            <h3>8. Cookies</h3>
            <p>
              Le site peut utiliser des cookies pour le fonctionnement et l'amelioration de l'experience utilisateur.
              L'utilisateur peut configurer son navigateur pour refuser les cookies.
            </p>
            <h3>9. Modification de la politique</h3>
            <p>
              L'ASAA se reserve le droit de modifier la presente politique a tout moment. Les modifications prennent
              effet des leur publication sur le site.
            </p>
            <h3>10. Contact</h3>
            <p>Pour toute question, contactez l'ASAA :</p>
            <ul>
              <li>0574724233</li>
              <li>0705583082</li>
              <li>0779382233</li>
              <li>0151495971</li>
            </ul>
            <button type="button" className="home-action-btn" onClick={() => setCurrentPage('home')}>
              Retour a l'accueil
            </button>
          </section>
        )}

        {currentPage === 'terms' && (
          <section className="status-section">
            <h2>Conditions d'utilisation</h2>
            <p>L'utilisation de la plateforme implique le respect des regles et la bonne conduite en communaute.</p>
            <button type="button" className="home-action-btn" onClick={() => setCurrentPage('home')}>
              Retour a l'accueil
            </button>
          </section>
        )}

        {currentPage === 'activities' && (
          <section className="status-section">
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
            <button type="button" className="home-action-btn" onClick={() => setCurrentPage('home')}>
              Retour a l'accueil
            </button>
          </section>
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

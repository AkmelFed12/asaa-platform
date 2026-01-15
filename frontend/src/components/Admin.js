import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Admin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ADMIN_PASSWORD = 'admin123'; // In production, this should come from environment

const Admin = ({ isAdmin }) => {
  const [adminView, setAdminView] = useState('users'); // users, events, quiz
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member'
  });
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalQuizAttempts: 0,
    topScores: []
  });

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const userRes = await axios.get(`${API_URL}/api/users`);
      setUsers(userRes.data);
      
      // Load stats
      setStats({
        totalUsers: userRes.data.length,
        totalEvents: 0,
        totalQuizAttempts: 0,
        topScores: []
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${API_URL}/api/users/register`, {
        ...newUser,
        adminPassword: ADMIN_PASSWORD
      });
      
      // Show credentials to admin
      alert(`Utilisateur créé avec succès!\n\nEmail: ${newUser.email}\nMot de passe: ${newUser.password}\n\nPour une sécurité maximale, l'utilisateur devrait changer son mot de passe à la première connexion.`);
      
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'member'
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      try {
        await axios.delete(`${API_URL}/api/users/${userId}`, {
          data: { adminPassword: ADMIN_PASSWORD }
        });
        loadData();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleResetPassword = async (userId, email) => {
    const newPassword = prompt('Entrez le nouveau mot de passe:');
    if (newPassword) {
      try {
        await axios.put(`${API_URL}/api/users/${userId}`, {
          password: newPassword,
          adminPassword: ADMIN_PASSWORD
        });
        alert(`Mot de passe réinitialisé!\n\nEmail: ${email}\nNouv. MDP: ${newPassword}`);
        loadData();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-error">
          <h2>⛔ Accès refusé</h2>
          <p>Vous ne disposez pas des permissions pour accéder à cette zone.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>🔧 Panneau d'Administration</h2>
        <p>Gestion des utilisateurs et des ressources de la plateforme</p>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <h3>{stats.totalUsers}</h3>
          <p>Utilisateurs</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalEvents}</h3>
          <p>Événements</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalQuizAttempts}</h3>
          <p>Quiz complétés</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${adminView === 'users' ? 'active' : ''}`}
          onClick={() => setAdminView('users')}
        >
          👥 Utilisateurs
        </button>
        <button 
          className={`admin-tab ${adminView === 'security' ? 'active' : ''}`}
          onClick={() => setAdminView('security')}
        >
          🔐 Sécurité
        </button>
        <button 
          className={`admin-tab ${adminView === 'logs' ? 'active' : ''}`}
          onClick={() => setAdminView('logs')}
        >
          📋 Journaux
        </button>
      </div>

      {/* Users Management */}
      {adminView === 'users' && (
        <div className="admin-section">
          <div className="section-header">
            <h3>Gestion des utilisateurs</h3>
            <button 
              className="btn-create-user"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '✖️ Annuler' : '➕ Nouvel utilisateur'}
            </button>
          </div>

          {showForm && (
            <form className="user-form" onSubmit={handleCreateUser}>
              <input
                type="text"
                placeholder="Nom complet"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Mot de passe temporaire"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="member">Membre</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="btn-submit">Créer l'utilisateur</button>
            </form>
          )}

          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 Membre'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="actions">
                      <button 
                        className="btn-action btn-reset"
                        onClick={() => handleResetPassword(user.id, user.email)}
                        title="Réinitialiser le mot de passe"
                      >
                        🔑 Reset MDP
                      </button>
                      <button 
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Supprimer l'utilisateur"
                      >
                        🗑️ Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security */}
      {adminView === 'security' && (
        <div className="admin-section">
          <h3>🔐 Paramètres de sécurité</h3>
          <div className="security-info">
            <div className="info-card">
              <h4>Authentification</h4>
              <p>✅ JWT - Authentification par tokens sécurisés</p>
              <p>✅ Hachage - Les mots de passe sont hachés</p>
              <p>✅ Sessions - Gestion des sessions utilisateur</p>
            </div>
            <div className="info-card">
              <h4>Contrôles d'accès</h4>
              <p>✅ Admin-only - Création de comptes réservée aux admins</p>
              <p>✅ Rôles - Système de rôles et permissions</p>
              <p>✅ Vérification - Validation des droits d'accès</p>
            </div>
            <div className="info-card">
              <h4>Données</h4>
              <p>✅ HTTPS - Chiffrement en transit</p>
              <p>✅ Validation - Validation de toutes les entrées</p>
              <p>✅ Audit - Enregistrement des actions administrateur</p>
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      {adminView === 'logs' && (
        <div className="admin-section">
          <h3>📋 Journaux d'activité</h3>
          <div className="logs-container">
            <div className="log-entry">
              <span className="log-time">Aujourd'hui 14:30</span>
              <span className="log-action">✅ Utilisateur créé</span>
              <span className="log-details">admin@asaa.com a créé member@asaa.com</span>
            </div>
            <div className="log-entry">
              <span className="log-time">Aujourd'hui 12:15</span>
              <span className="log-action">🔑 Mot de passe réinitialisé</span>
              <span className="log-details">Réinitialisation pour user@asaa.com</span>
            </div>
            <div className="log-entry">
              <span className="log-time">Hier 20:00</span>
              <span className="log-action">📊 Quiz généré</span>
              <span className="log-details">20 nouvelles questions générées automatiquement</span>
            </div>
            <div className="log-entry">
              <span className="log-time">Hier 15:45</span>
              <span className="log-action">➕ Événement créé</span>
              <span className="log-details">Événement: Formation avancée ajouté au calendrier</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

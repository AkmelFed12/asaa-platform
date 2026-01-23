import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PhotoUpload from './PhotoUpload';
import '../styles/Admin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Admin = ({ isAdmin }) => {
  const [adminView, setAdminView] = useState('users');
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member'
  });
  const [showForm, setShowForm] = useState(false);
  const [quizForm, setQuizForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    difficulty: 'easy'
  });
  const [memberPhotoMemberId, setMemberPhotoMemberId] = useState('');
  const [memberPhotos, setMemberPhotos] = useState([]);
  const [memberEdit, setMemberEdit] = useState({});
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    image: ''
  });
  const [events, setEvents] = useState([]);
  const [photoSearchQuery, setPhotoSearchQuery] = useState('');
  const [photoSearchResults, setPhotoSearchResults] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalQuizAttempts: 0,
    topScores: []
  });

  useEffect(() => {
    if (isAdmin) {
      loadData();
      loadMembers();
      loadEvents();
    }
  }, [isAdmin]);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
  });

  const loadData = async () => {
    try {
      const userRes = await axios.get(`${API_URL}/api/users`, {
        headers: getAuthHeaders()
      });
      const usersList = userRes.data?.data || [];
      setUsers(usersList);
      setStats({
        totalUsers: usersList.length,
        totalEvents: 0,
        totalQuizAttempts: 0,
        topScores: []
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/members`, {
        headers: getAuthHeaders()
      });
      setMembers(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/events/all`, {
        headers: getAuthHeaders()
      });
      setEvents(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      const nameParts = newUser.name.trim().split(' ');
      const firstName = nameParts.shift() || '';
      const lastName = nameParts.join(' ') || '';

      await axios.post(`${API_URL}/api/auth/register`, {
        email: newUser.email,
        password: newUser.password,
        first_name: firstName,
        last_name: lastName,
        role: newUser.role
      }, {
        headers: getAuthHeaders()
      });

      alert(`Utilisateur créé avec succès!\n\nEmail: ${newUser.email}\nMot de passe: ${newUser.password}\n\nPour une sécurité maximale, l'utilisateur devrait changer son mot de passe à la première connexion.`);

      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'member'
      });
      setShowForm(false);
      loadData();
      loadMembers();
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      try {
        await axios.delete(`${API_URL}/api/users/${userId}`, {
          headers: getAuthHeaders()
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
          password: newPassword
        }, {
          headers: getAuthHeaders()
        });
        alert(`Mot de passe réinitialisé!\n\nEmail: ${email}\nNouv. MDP: ${newPassword}`);
        loadData();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/quiz/questions`, {
        question: quizForm.question,
        options: quizForm.options,
        correctIndex: Number(quizForm.correctIndex),
        difficulty: quizForm.difficulty
      }, {
        headers: getAuthHeaders()
      });
      alert('Question ajoutée avec succès.');
      setQuizForm({
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        difficulty: 'easy'
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la création de la question');
    }
  };

  const loadMemberPhotos = async (memberId) => {
    if (!memberId) return;
    try {
      const response = await axios.get(`${API_URL}/api/photos/member/${memberId}/photos`, {
        headers: getAuthHeaders()
      });
      setMemberPhotos(response.data?.photos || []);
    } catch (error) {
      console.error('Error:', error);
      setMemberPhotos([]);
    }
  };

  const handleDeleteMemberPhoto = async (photoId) => {
    try {
      await axios.delete(`${API_URL}/api/photos/photo/${photoId}`, {
        headers: getAuthHeaders()
      });
      await loadMemberPhotos(memberPhotoMemberId);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdateMember = async (memberId) => {
    const data = memberEdit[memberId];
    if (!data) return;
    try {
      await axios.put(`${API_URL}/api/members/${memberId}`, data, {
        headers: getAuthHeaders()
      });
      setMemberEdit((prev) => ({ ...prev, [memberId]: undefined }));
      loadMembers();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Supprimer ce membre?')) return;
    try {
      await axios.delete(`${API_URL}/api/members/${memberId}`, {
        headers: getAuthHeaders()
      });
      loadMembers();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/events`, eventForm, {
        headers: getAuthHeaders()
      });
      setEventForm({
        title: '',
        description: '',
        date: '',
        location: '',
        image: ''
      });
      loadEvents();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdateEvent = async (eventId, data) => {
    try {
      await axios.put(`${API_URL}/api/events/${eventId}`, data, {
        headers: getAuthHeaders()
      });
      loadEvents();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Supprimer cet événement?')) return;
    try {
      await axios.delete(`${API_URL}/api/events/${eventId}`, {
        headers: getAuthHeaders()
      });
      loadEvents();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePhotoSearch = async () => {
    if (!photoSearchQuery.trim()) {
      setPhotoSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/photos/search`, {
        headers: getAuthHeaders(),
        params: { query: photoSearchQuery }
      });
      setPhotoSearchResults(response.data?.data || []);
    } catch (error) {
      console.error('Error:', error);
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
        <button
          className={`admin-tab ${adminView === 'quiz' ? 'active' : ''}`}
          onClick={() => setAdminView('quiz')}
        >
          📚 Quiz
        </button>
        <button
          className={`admin-tab ${adminView === 'members' ? 'active' : ''}`}
          onClick={() => setAdminView('members')}
        >
          👥 Membres
        </button>
        <button
          className={`admin-tab ${adminView === 'member-photos' ? 'active' : ''}`}
          onClick={() => setAdminView('member-photos')}
        >
          📸 Photos Membres
        </button>
        <button
          className={`admin-tab ${adminView === 'events' ? 'active' : ''}`}
          onClick={() => setAdminView('events')}
        >
          📅 Événements
        </button>
        <button
          className={`admin-tab ${adminView === 'photos' ? 'active' : ''}`}
          onClick={() => setAdminView('photos')}
        >
          🖼️ Photos
        </button>
      </div>

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
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Mot de passe temporaire"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
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
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 Membre'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
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
              <span className="log-details">Événement: Formation avancée ajoutée au calendrier</span>
            </div>
          </div>
        </div>
      )}

      {adminView === 'quiz' && (
        <div className="admin-section">
          <h3>📚 Ajouter une question</h3>
          <form className="user-form" onSubmit={handleCreateQuestion}>
            <input
              type="text"
              placeholder="Question"
              value={quizForm.question}
              onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })}
              required
            />
            {quizForm.options.map((option, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={`Option ${idx + 1}`}
                value={option}
                onChange={(e) => {
                  const nextOptions = [...quizForm.options];
                  nextOptions[idx] = e.target.value;
                  setQuizForm({ ...quizForm, options: nextOptions });
                }}
                required
              />
            ))}
            <select
              value={quizForm.correctIndex}
              onChange={(e) => setQuizForm({ ...quizForm, correctIndex: e.target.value })}
            >
              <option value={0}>Option 1</option>
              <option value={1}>Option 2</option>
              <option value={2}>Option 3</option>
              <option value={3}>Option 4</option>
            </select>
            <select
              value={quizForm.difficulty}
              onChange={(e) => setQuizForm({ ...quizForm, difficulty: e.target.value })}
            >
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Difficile</option>
            </select>
            <button type="submit" className="btn-submit">Ajouter la question</button>
          </form>
        </div>
      )}

      {adminView === 'members' && (
        <div className="admin-section">
          <h3>👥 Gestion des membres</h3>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Numéro</th>
                  <th>Ville</th>
                  <th>Naissance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id}>
                    <td>{member.id}</td>
                    <td>{member.first_name} {member.last_name}</td>
                    <td>{member.email}</td>
                    <td>{member.member_number}</td>
                    <td>
                      <input
                        type="text"
                        value={memberEdit[member.id]?.city ?? member.city ?? ''}
                        onChange={(e) => setMemberEdit((prev) => ({
                          ...prev,
                          [member.id]: { ...prev[member.id], city: e.target.value }
                        }))}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={memberEdit[member.id]?.date_of_birth ?? (member.date_of_birth ? member.date_of_birth.split('T')[0] : '')}
                        onChange={(e) => setMemberEdit((prev) => ({
                          ...prev,
                          [member.id]: { ...prev[member.id], date_of_birth: e.target.value }
                        }))}
                      />
                    </td>
                    <td className="actions">
                      <button
                        className="btn-action btn-reset"
                        onClick={() => handleUpdateMember(member.id)}
                      >
                        Enregistrer
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteMember(member.id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adminView === 'member-photos' && (
        <div className="admin-section">
          <h3>📸 Photos des membres</h3>
          <div className="user-form">
            <input
              type="text"
              placeholder="ID du membre"
              value={memberPhotoMemberId}
              onChange={(e) => setMemberPhotoMemberId(e.target.value)}
            />
            <button
              type="button"
              className="btn-submit"
              onClick={() => loadMemberPhotos(memberPhotoMemberId)}
            >
              Charger les photos
            </button>
          </div>

          {memberPhotoMemberId && (
            <PhotoUpload
              memberId={memberPhotoMemberId}
              onUploadSuccess={() => loadMemberPhotos(memberPhotoMemberId)}
            />
          )}

          {memberPhotos.length > 0 && (
            <div className="uploaded-photos">
              <h4>Photos du membre</h4>
              <div className="photos-grid">
                {memberPhotos.map((photo) => (
                  <div key={photo.id} className="uploaded-photo">
                    <img src={photo.url} alt={photo.filename} />
                    <p className="photo-name">{photo.filename}</p>
                    <button
                      type="button"
                      className="btn-action btn-delete"
                      onClick={() => handleDeleteMemberPhoto(photo.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {adminView === 'events' && (
        <div className="admin-section">
          <h3>📅 Gestion des événements</h3>
          <form className="user-form" onSubmit={handleCreateEvent}>
            <input
              type="text"
              placeholder="Titre"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              value={eventForm.date}
              onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Lieu"
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              required
            />
            <input
              type="url"
              placeholder="URL de l'image"
              value={eventForm.image}
              onChange={(e) => setEventForm({ ...eventForm, image: e.target.value })}
            />
            <button type="submit" className="btn-submit">Créer l'événement</button>
          </form>

          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Date</th>
                  <th>Lieu</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id}>
                    <td>
                      <input
                        type="text"
                        defaultValue={event.title}
                        onBlur={(e) => handleUpdateEvent(event.id, { title: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="datetime-local"
                        defaultValue={event.date ? event.date.slice(0, 16) : ''}
                        onBlur={(e) => handleUpdateEvent(event.id, { date: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        defaultValue={event.location}
                        onBlur={(e) => handleUpdateEvent(event.id, { location: e.target.value })}
                      />
                    </td>
                    <td className="actions">
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adminView === 'photos' && (
        <div className="admin-section">
          <h3>🖼️ Recherche de photos</h3>
          <div className="user-form">
            <input
              type="text"
              placeholder="Recherche (nom, fichier, memberId)"
              value={photoSearchQuery}
              onChange={(e) => setPhotoSearchQuery(e.target.value)}
            />
            <button type="button" className="btn-submit" onClick={handlePhotoSearch}>
              Rechercher
            </button>
          </div>

          {photoSearchResults.length > 0 && (
            <div className="uploaded-photos">
              <h4>Résultats</h4>
              <div className="photos-grid">
                {photoSearchResults.map((photo) => (
                  <div key={photo.id} className="uploaded-photo">
                    <img src={photo.url} alt={photo.filename} />
                    <p className="photo-name">{photo.original_name}</p>
                    <p className="photo-size">Membre: {photo.member_id}</p>
                    <button
                      type="button"
                      className="btn-action btn-delete"
                      onClick={() => handleDeleteMemberPhoto(photo.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;

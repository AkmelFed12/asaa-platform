import React, { useState } from 'react';
import { authService } from '../services/api';
import '../styles/Auth.css';

function Auth({ onLogin }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginMode) {
        const response = await authService.login(email, password);
        if (response.data && response.data.user) {
          onLogin(response.data.user);
        }
      } else {
        const response = await authService.register({
          email,
          password,
          first_name: firstName,
          last_name: lastName
        });
        if (response.data && response.data.user) {
          alert('Inscription réussie! Vous pouvez maintenant vous connecter.');
          setIsLoginMode(true);
          setEmail('');
          setPassword('');
          setFirstName('');
          setLastName('');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>ASAA</h1>
        <p className="subtitle">Association des Serviteurs d'Allah Azawajal</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {!isLoginMode && (
            <>
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={!isLoginMode}
                />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required={!isLoginMode}
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Chargement...' : (isLoginMode ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>
        
        <button
          type="button"
          onClick={() => setIsLoginMode(!isLoginMode)}
          className="toggle-btn"
        >
          {isLoginMode ? 'Pas de compte? S\'inscrire' : 'Déjà inscrit? Se connecter'}
        </button>
      </div>
    </div>
  );
}

export default Auth;

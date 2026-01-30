import React, { useState } from 'react';
import { authService } from '../services/api';
import '../styles/Auth.css';

function Auth({ onLogin, onGuestAccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      if (response.data && response.data.user) {
        onLogin({ user: response.data.user, token: response.data.token });
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
            {loading ? 'Chargement...' : 'Se connecter'}
          </button>
        </form>
        {onGuestAccess && (
          <button type="button" className="toggle-btn" onClick={onGuestAccess}>
            Acces invite
          </button>
        )}
      </div>
    </div>
  );
}

export default Auth;

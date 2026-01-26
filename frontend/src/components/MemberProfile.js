import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import '../styles/MemberProfile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MemberProfile = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMembers = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.get('/api/members');
        setMembers(response.data?.data || []);
      } catch (loadError) {
        console.error('Error:', loadError);
        setError('Impossible de charger les membres.');
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };
    loadMembers();
  }, [user?.id]);

  const normalizePhotoUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('/uploads/')) {
      return `${API_URL}${url}`;
    }
    return url;
  };

  return (
    <div className="governance-container">
      <h2>Membres</h2>
      <p className="subtitle">Annuaire des membres</p>

      {loading && <p>Chargement...</p>}
      {error && <p className="member-error">{error}</p>}
      {!loading && !error && members.length === 0 && (
        <p>Aucun membre enregistre.</p>
      )}
      {members.length > 0 && (
        <div className="member-grid">
          {members.map((member) => (
            <div key={member.id} className="member-card">
              <div className="member-photo">
                {member.photo_url ? (
                  <img src={normalizePhotoUrl(member.photo_url)} alt={member.first_name} />
                ) : (
                  <div className="member-photo-placeholder">👤</div>
                )}
              </div>
              <div className="member-info">
                <h3>{member.first_name} {member.last_name}</h3>
                <p>Numero membre: {member.member_number}</p>
                <p>Email: {member.email}</p>
                <p>Telephone: {member.phone || '-'}</p>
                <p>Ville: {member.city || '-'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberProfile;

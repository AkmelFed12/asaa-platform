import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import PhotoUpload from './PhotoUpload';
import '../styles/PhotoUpload.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MemberProfile = ({ user }) => {
  const [member, setMember] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMember = async () => {
    if (!user?.id) return;
    try {
      const response = await apiClient.get(`/api/members/user/${user.id}`);
      setMember(response.data?.data || null);
    } catch (error) {
      console.error('Error:', error);
      setMember(null);
    }
  };

  const loadPhotos = async (memberId) => {
    if (!memberId) return;
    try {
      const response = await apiClient.get(`/api/photos/member/${memberId}/photos`);
      setPhotos(response.data?.photos || []);
    } catch (error) {
      console.error('Error:', error);
      setPhotos([]);
    }
  };

  const setPrimaryPhoto = async (photoId) => {
    if (!member?.id) return;
    setLoading(true);
    try {
      await apiClient.put(`/api/photos/member/${member.id}/primary/${photoId}`);
      await loadPhotos(member.id);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMember();
  }, [user?.id]);

  useEffect(() => {
    if (member?.id) {
      loadPhotos(member.id);
    }
  }, [member?.id]);

  if (!member) {
    return (
      <div className="governance-container">
        <h2>👤 Profil</h2>
        <p>Profil membre introuvable.</p>
      </div>
    );
  }

  const primaryPhoto = photos.find((photo) => photo.is_primary);
  const normalizePhotoUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('/uploads/')) {
      return `${API_URL}${url}`;
    }
    return url;
  };

  return (
    <div className="governance-container">
      <h2>👤 Profil Membre</h2>
      <p className="subtitle">{member.first_name} {member.last_name}</p>

      {primaryPhoto && (
        <div className="uploaded-photo">
          <img src={normalizePhotoUrl(primaryPhoto.url)} alt={primaryPhoto.filename} />
          <p className="photo-name">Photo principale</p>
        </div>
      )}

      <div className="admin-section">
        <h3>Infos</h3>
        <p>Email: {member.email}</p>
        <p>Numéro membre: {member.member_number}</p>
        <p>Ville: {member.city || '-'}</p>
        <p>Date de naissance: {member.date_of_birth ? member.date_of_birth.split('T')[0] : '-'}</p>
      </div>

      <PhotoUpload
        memberId={member.id}
        onUploadSuccess={() => loadPhotos(member.id)}
      />

      {photos.length > 0 && (
        <div className="uploaded-photos">
          <h4>Mes photos</h4>
          <div className="photos-grid">
            {photos.map((photo) => (
              <div key={photo.id} className="uploaded-photo">
                <img src={normalizePhotoUrl(photo.url)} alt={photo.filename} />
                <p className="photo-name">{photo.original_name}</p>
                <button
                  type="button"
                  className="btn-action btn-reset"
                  onClick={() => setPrimaryPhoto(photo.id)}
                  disabled={loading}
                >
                  {photo.is_primary ? 'Principale' : 'Définir principale'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberProfile;

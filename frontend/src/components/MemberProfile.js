import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PhotoUpload from './PhotoUpload';
import '../styles/MemberProfile.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const defaultExtras = {
  bio: '',
  address: '',
  emergency_name: '',
  emergency_phone: '',
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  social_linkedin: '',
  notify_email: true,
  notify_whatsapp: true,
  visibility_directory: true
};

const mapExtrasData = (data) => ({
  bio: data?.bio ?? '',
  address: data?.address ?? '',
  emergency_name: data?.emergency_name ?? '',
  emergency_phone: data?.emergency_phone ?? '',
  social_facebook: data?.social_facebook ?? '',
  social_instagram: data?.social_instagram ?? '',
  social_twitter: data?.social_twitter ?? '',
  social_linkedin: data?.social_linkedin ?? '',
  notify_email: data?.notify_email ?? true,
  notify_whatsapp: data?.notify_whatsapp ?? true,
  visibility_directory: data?.visibility_directory ?? true
});

const MemberProfile = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMember, setProfileMember] = useState(null);
  const [profileForm, setProfileForm] = useState({
    phone: '',
    city: '',
    date_of_birth: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [memberPhotos, setMemberPhotos] = useState([]);
  const [memberPhotosLoading, setMemberPhotosLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [activityHistory, setActivityHistory] = useState([]);
  const [adminSelectedMember, setAdminSelectedMember] = useState(null);
  const [adminMemberPhotos, setAdminMemberPhotos] = useState([]);
  const [adminMemberHistory, setAdminMemberHistory] = useState([]);
  const [adminMemberLoading, setAdminMemberLoading] = useState(false);
  const [adminMemberError, setAdminMemberError] = useState('');
  const [adminMemberExtras, setAdminMemberExtras] = useState(null);
  const [extras, setExtras] = useState(defaultExtras);
  const [extrasLoading, setExtrasLoading] = useState(false);
  const [extrasSaving, setExtrasSaving] = useState(false);
  const [extrasSaved, setExtrasSaved] = useState(false);
  const [extrasError, setExtrasError] = useState('');

  const isAdmin = user?.role === 'admin';

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
  });

  useEffect(() => {
    const loadExtras = async () => {
      if (!user?.id) return;
      setExtrasLoading(true);
      setExtrasError('');
      try {
        const response = await axios.get(`${API_URL}/api/profile/extras/${user.id}`, {
          headers: getAuthHeaders()
        });
        const data = response.data?.data || null;
        setExtras(mapExtrasData(data));
      } catch (loadError) {
        console.error('Error:', loadError);
        setExtrasError('Impossible de charger les informations complementaires.');
      } finally {
        setExtrasLoading(false);
      }
    };
    loadExtras();
  }, [user?.id]);

  useEffect(() => {
    const loadMembers = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_URL}/api/members`, {
          headers: getAuthHeaders()
        });
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

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      setProfileLoading(true);
      setProfileError('');
      try {
        const response = await axios.get(`${API_URL}/api/members/user/${user.id}`, {
          headers: getAuthHeaders()
        });
        const data = response.data?.data || null;
        setProfileMember(data);
        if (data) {
          setProfileForm({
            phone: data.phone || '',
            city: data.city || '',
            date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : ''
          });
          await loadMemberPhotos(data.id, false);
        }
      } catch (loadError) {
        console.error('Error:', loadError);
        setProfileError('Impossible de charger votre profil.');
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [user?.id]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) return;
      setActivityLoading(true);
      setActivityError('');
      try {
        const response = await axios.get(`${API_URL}/api/quiz/daily/history/${user.id}`);
        setActivityHistory(response.data?.history || []);
      } catch (loadError) {
        console.error('Error:', loadError);
        setActivityError('Impossible de charger vos activites.');
        setActivityHistory([]);
      } finally {
        setActivityLoading(false);
      }
    };
    loadHistory();
  }, [user?.id]);

  const normalizePhotoUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('/uploads/')) {
      return `${API_URL}${url}`;
    }
    return url;
  };

  const loadMemberPhotos = async (memberId, showError = true) => {
    if (!memberId) return;
    setMemberPhotosLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/photos/member/${memberId}/photos`, {
        headers: getAuthHeaders()
      });
      setMemberPhotos(response.data?.photos || []);
    } catch (loadError) {
      console.error('Error:', loadError);
      if (showError) {
        setProfileError('Impossible de charger les photos.');
      }
      setMemberPhotos([]);
    } finally {
      setMemberPhotosLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!profileMember?.id) return;
    setProfileSaving(true);
    setProfileSaved(false);
    setProfileError('');
    try {
      const response = await axios.put(`${API_URL}/api/members/self`, {
        phone: profileForm.phone || null,
        city: profileForm.city || null,
        date_of_birth: profileForm.date_of_birth || null
      }, {
        headers: getAuthHeaders()
      });
      const updated = response.data?.data;
      if (updated) {
        setProfileMember((prev) => ({ ...prev, ...updated }));
        setProfileSaved(true);
      }
    } catch (saveError) {
      console.error('Error:', saveError);
      const message = saveError?.response?.data?.error;
      setProfileError(message || 'Impossible de mettre a jour le profil.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleExtrasChange = (key, value) => {
    setExtrasSaved(false);
    setExtrasError('');
    setExtras((prev) => ({ ...prev, [key]: value }));
  };

  const saveExtras = async () => {
    if (!user?.id) return;
    setExtrasSaving(true);
    setExtrasSaved(false);
    setExtrasError('');
    try {
      const response = await axios.put(`${API_URL}/api/profile/extras`, extras, {
        headers: getAuthHeaders()
      });
      const data = response.data?.data || null;
      setExtras(mapExtrasData(data || extras));
      setExtrasSaved(true);
    } catch (saveError) {
      console.error('Error:', saveError);
      const message = saveError?.response?.data?.error;
      setExtrasError(message || 'Impossible de sauvegarder les informations complementaires.');
    } finally {
      setExtrasSaving(false);
    }
  };

  const handleSetPrimaryPhoto = async (photoId) => {
    if (!profileMember?.id || !photoId) return;
    try {
      await axios.put(`${API_URL}/api/photos/member/${profileMember.id}/primary/${photoId}`, {}, {
        headers: getAuthHeaders()
      });
      await loadMemberPhotos(profileMember.id, false);
    } catch (photoError) {
      console.error('Error:', photoError);
      setProfileError('Impossible de definir la photo principale.');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!photoId) return;
    try {
      await axios.delete(`${API_URL}/api/photos/photo/${photoId}`, {
        headers: getAuthHeaders()
      });
      await loadMemberPhotos(profileMember.id, false);
    } catch (photoError) {
      console.error('Error:', photoError);
      setProfileError('Impossible de supprimer la photo.');
    }
  };

  const handleAdminSelectMember = async (member) => {
    if (!member?.id) return;
    setAdminSelectedMember(member);
    setAdminMemberLoading(true);
    setAdminMemberError('');
    setAdminMemberExtras(null);
    try {
      const [photosRes, historyRes, extrasRes] = await Promise.all([
        axios.get(`${API_URL}/api/photos/member/${member.id}/photos`, {
          headers: getAuthHeaders()
        }),
        axios.get(`${API_URL}/api/quiz/daily/history/${member.user_id}`),
        axios.get(`${API_URL}/api/profile/extras/${member.user_id}`, {
          headers: getAuthHeaders()
        })
      ]);
      setAdminMemberPhotos(photosRes.data?.photos || []);
      setAdminMemberHistory(historyRes.data?.history || []);
      const extrasData = extrasRes.data?.data || null;
      setAdminMemberExtras(extrasData ? mapExtrasData(extrasData) : null);
    } catch (loadError) {
      console.error('Error:', loadError);
      setAdminMemberError('Impossible de charger le profil du membre.');
      setAdminMemberPhotos([]);
      setAdminMemberHistory([]);
      setAdminMemberExtras(null);
    } finally {
      setAdminMemberLoading(false);
    }
  };

  const primaryPhoto = memberPhotos.find((photo) => photo.is_primary) || memberPhotos[0];

  return (
    <div className="governance-container profile-page">
      <h2>Profil</h2>
      <p className="subtitle">Gerez votre profil et vos informations personnelles.</p>

      {profileLoading && <p>Chargement du profil...</p>}
      {profileError && <p className="member-error">{profileError}</p>}

      {profileMember && (
        <section className="profile-section profile-summary">
          <div className="profile-card">
            <div className="profile-card-photo">
              {primaryPhoto ? (
                <img src={normalizePhotoUrl(primaryPhoto.url)} alt={profileMember.first_name} />
              ) : (
                <div className="profile-photo-placeholder">👤</div>
              )}
            </div>
            <div className="profile-card-info">
              <h3>{profileMember.first_name} {profileMember.last_name}</h3>
              <p>Role: {profileMember.role}</p>
              <p>Numero membre: {profileMember.member_number}</p>
              <p>Email: {profileMember.email}</p>
              <p>Telephone: {profileMember.phone || '-'}</p>
              <p>Ville: {profileMember.city || '-'}</p>
            </div>
          </div>

          <div className="profile-photo-tools">
            <h4>Photo de profil</h4>
            <div className="profile-photo-uploader">
              <PhotoUpload
                memberId={profileMember.id}
                onUploadSuccess={() => loadMemberPhotos(profileMember.id, false)}
              />
            </div>
            {memberPhotosLoading && <p>Chargement des photos...</p>}
            {!memberPhotosLoading && memberPhotos.length > 0 && (
              <div className="profile-photos-grid">
                {memberPhotos.map((photo) => (
                  <div key={photo.id} className={`profile-photo-card ${photo.is_primary ? 'primary' : ''}`}>
                    <img src={normalizePhotoUrl(photo.url)} alt={photo.original_name} />
                    <div className="profile-photo-actions">
                      {!photo.is_primary && (
                        <button type="button" onClick={() => handleSetPrimaryPhoto(photo.id)}>
                          Definir principale
                        </button>
                      )}
                      <button type="button" onClick={() => handleDeletePhoto(photo.id)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {profileMember && (
        <section className="profile-section profile-edit">
          <div className="profile-form">
            <h4>Mes informations</h4>
            <div className="profile-form-grid">
              <label>
                Telephone
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </label>
              <label>
                Ville
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                />
              </label>
              <label>
                Date de naissance
                <input
                  type="date"
                  value={profileForm.date_of_birth}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                />
              </label>
            </div>
            <button
              type="button"
              className="profile-save-btn"
              onClick={updateProfile}
              disabled={profileSaving}
            >
              {profileSaving ? 'Enregistrement...' : 'Mettre a jour'}
            </button>
            {profileSaved && <p className="profile-success">Profil mis a jour.</p>}
          </div>

          <div className="profile-form">
            <h4>Informations complementaires</h4>
            {extrasLoading && <p>Chargement...</p>}
            {extrasError && <p className="member-error">{extrasError}</p>}
            <label>
              Bio
              <textarea
                value={extras.bio}
                onChange={(e) => handleExtrasChange('bio', e.target.value)}
                rows={3}
              />
            </label>
            <label>
              Adresse
              <input
                type="text"
                value={extras.address}
                onChange={(e) => handleExtrasChange('address', e.target.value)}
              />
            </label>
            <div className="profile-form-grid">
              <label>
                Contact d'urgence - Nom
                <input
                  type="text"
                  value={extras.emergency_name}
                  onChange={(e) => handleExtrasChange('emergency_name', e.target.value)}
                />
              </label>
              <label>
                Contact d'urgence - Telephone
                <input
                  type="text"
                  value={extras.emergency_phone}
                  onChange={(e) => handleExtrasChange('emergency_phone', e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="profile-form">
            <h4>Reseaux & Preferences</h4>
            <div className="profile-form-grid">
              <label>
                Facebook
                <input
                  type="text"
                  value={extras.social_facebook}
                  onChange={(e) => handleExtrasChange('social_facebook', e.target.value)}
                />
              </label>
              <label>
                Instagram
                <input
                  type="text"
                  value={extras.social_instagram}
                  onChange={(e) => handleExtrasChange('social_instagram', e.target.value)}
                />
              </label>
              <label>
                Twitter/X
                <input
                  type="text"
                  value={extras.social_twitter}
                  onChange={(e) => handleExtrasChange('social_twitter', e.target.value)}
                />
              </label>
              <label>
                LinkedIn
                <input
                  type="text"
                  value={extras.social_linkedin}
                  onChange={(e) => handleExtrasChange('social_linkedin', e.target.value)}
                />
              </label>
            </div>
            <div className="profile-toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={extras.notify_email}
                  onChange={(e) => handleExtrasChange('notify_email', e.target.checked)}
                />
                Notifications par email
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={extras.notify_whatsapp}
                  onChange={(e) => handleExtrasChange('notify_whatsapp', e.target.checked)}
                />
                Notifications WhatsApp
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={extras.visibility_directory}
                  onChange={(e) => handleExtrasChange('visibility_directory', e.target.checked)}
                />
                Afficher dans l'annuaire
              </label>
            </div>
            <div className="profile-form-actions">
              <button
                type="button"
                className="profile-save-btn"
                onClick={saveExtras}
                disabled={extrasSaving || extrasLoading}
              >
                {extrasSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              {extrasSaved && <p className="profile-success">Infos complementaires enregistrees.</p>}
            </div>
          </div>
        </section>
      )}

      <section className="profile-section profile-activity">
        <h4>Mes activites recentes</h4>
        {activityLoading && <p>Chargement...</p>}
        {activityError && <p className="member-error">{activityError}</p>}
        {!activityLoading && !activityError && activityHistory.length === 0 && (
          <p>Aucune activite recente.</p>
        )}
        {activityHistory.length > 0 && (
          <div className="activity-table">
            <div className="activity-row activity-header">
              <span>Date</span>
              <span>Score</span>
              <span>Niveau</span>
              <span>Temps</span>
            </div>
            {activityHistory.map((entry, index) => (
              <div key={`${entry.quiz_id}-${index}`} className="activity-row">
                <span>{entry.completed_at ? new Date(entry.completed_at).toLocaleDateString('fr-FR') : '-'}</span>
                <span>{entry.score ?? '-'}</span>
                <span>{entry.level || '-'}</span>
                <span>{entry.time_spent_seconds ? `${entry.time_spent_seconds}s` : '-'}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="profile-section profile-admin">
          <div className="profile-admin-header">
            <h4>Admin - Profils & activites des membres</h4>
            <p>Consultez les profils et l'historique d'activite des membres.</p>
          </div>
          <div className="profile-admin-grid">
            <div className="admin-member-list">
              {members.length === 0 && <p>Aucun membre.</p>}
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={`admin-member-item ${adminSelectedMember?.id === member.id ? 'active' : ''}`}
                  onClick={() => handleAdminSelectMember(member)}
                >
                  <span>{member.first_name} {member.last_name}</span>
                  <span className="admin-member-meta">{member.member_number}</span>
                </button>
              ))}
            </div>
            <div className="admin-member-details">
              {adminMemberLoading && <p>Chargement...</p>}
              {adminMemberError && <p className="member-error">{adminMemberError}</p>}
              {!adminMemberLoading && adminSelectedMember && (
                <>
                  <div className="admin-member-card">
                    <div className="member-photo small">
                      {adminMemberPhotos[0] ? (
                        <img src={normalizePhotoUrl(adminMemberPhotos[0].url)} alt={adminSelectedMember.first_name} />
                      ) : (
                        <div className="member-photo-placeholder">👤</div>
                      )}
                    </div>
                    <div>
                      <h5>{adminSelectedMember.first_name} {adminSelectedMember.last_name}</h5>
                      <p>Email: {adminSelectedMember.email}</p>
                      <p>Telephone: {adminSelectedMember.phone || '-'}</p>
                      <p>Ville: {adminSelectedMember.city || '-'}</p>
                    </div>
                  </div>
                  <div className="admin-extras">
                    <h5>Infos complementaires</h5>
                    {!adminMemberExtras && <p>Aucune information complementaire.</p>}
                    {adminMemberExtras && (
                      <div className="admin-extras-grid">
                        <div>
                          <span className="admin-extras-label">Bio</span>
                          <span>{adminMemberExtras.bio || '-'}</span>
                        </div>
                        <div>
                          <span className="admin-extras-label">Adresse</span>
                          <span>{adminMemberExtras.address || '-'}</span>
                        </div>
                        <div>
                          <span className="admin-extras-label">Contact urgence</span>
                          <span>{adminMemberExtras.emergency_name || '-'}</span>
                        </div>
                        <div>
                          <span className="admin-extras-label">Telephone urgence</span>
                          <span>{adminMemberExtras.emergency_phone || '-'}</span>
                        </div>
                        <div>
                          <span className="admin-extras-label">Facebook</span>
                          <span>{adminMemberExtras.social_facebook || '-'}</span>
                        </div>
                        <div>
                          <span className="admin-extras-label">Instagram</span>
                          <span>{adminMemberExtras.social_instagram || '-'}</span>
                        </div>
                        <div>
                          <span className="admin-extras-label">Twitter/X</span>
                          <span>{adminMemberExtras.social_twitter || '-'}</span>
                        </div>
                        <div>
                          <span className="admin-extras-label">LinkedIn</span>
                          <span>{adminMemberExtras.social_linkedin || '-'}</span>
                        </div>
                        <div>
                          <span className="admin-extras-label">Notif email</span>
                          <span>{adminMemberExtras.notify_email ? 'Oui' : 'Non'}</span>
                        </div>
                        <div>
                          <span className="admin-extras-label">Notif WhatsApp</span>
                          <span>{adminMemberExtras.notify_whatsapp ? 'Oui' : 'Non'}</span>
                        </div>
                        <div>
                          <span className="admin-extras-label">Visible annuaire</span>
                          <span>{adminMemberExtras.visibility_directory ? 'Oui' : 'Non'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="admin-activity">
                    <h5>Activites (Quiz)</h5>
                    {adminMemberHistory.length === 0 && <p>Aucune activite enregistree.</p>}
                    {adminMemberHistory.length > 0 && (
                      <div className="activity-table">
                        <div className="activity-row activity-header">
                          <span>Date</span>
                          <span>Score</span>
                          <span>Niveau</span>
                          <span>Temps</span>
                        </div>
                        {adminMemberHistory.map((entry, index) => (
                          <div key={`${entry.quiz_id}-${index}`} className="activity-row">
                            <span>{entry.completed_at ? new Date(entry.completed_at).toLocaleDateString('fr-FR') : '-'}</span>
                            <span>{entry.score ?? '-'}</span>
                            <span>{entry.level || '-'}</span>
                            <span>{entry.time_spent_seconds ? `${entry.time_spent_seconds}s` : '-'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              {!adminMemberLoading && !adminSelectedMember && (
                <p>Selectionnez un membre pour voir son profil.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="profile-section profile-directory">
        <h4>Annuaire des membres</h4>
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
      </section>
    </div>
  );
};

export default MemberProfile;

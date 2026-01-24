import React, { useState, useEffect } from 'react';
import { governanceService } from '../services/api';
import '../styles/Governance.css';

function Governance({ isAdmin }) {
  const [positions, setPositions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPosition, setNewPosition] = useState({
    position_name: '',
    position_type: '',
    description: '',
    holder_name: 'A pourvoir',
    holder_contact: '',
    holder_email: ''
  });

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      const response = await governanceService.getAll();
      setPositions(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des postes', error);
    }
  };

  const handleEdit = (position) => {
    setEditingId(position.id);
    setEditData({
      holder_name: position.holder_name,
      holder_contact: position.holder_contact || '',
      holder_email: position.holder_email || '',
      description: position.description || ''
    });
  };

  const handleSave = async (id) => {
    setLoading(true);
    try {
      await governanceService.update(id, editData);
      await loadPositions();
      setEditingId(null);
      alert('Poste mis a jour avec succes!');
    } catch (error) {
      alert('Erreur lors de la mise a jour');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleAddPosition = async () => {
    if (!newPosition.position_name || !newPosition.position_type) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    setLoading(true);
    try {
      await governanceService.create(newPosition);
      await loadPositions();
      setShowAddForm(false);
      setNewPosition({
        position_name: '',
        position_type: '',
        description: '',
        holder_name: 'A pourvoir',
        holder_contact: '',
        holder_email: ''
      });
      alert('Nouveau poste ajoute avec succes!');
    } catch (error) {
      alert('Erreur lors de la creation du poste');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePosition = async (id) => {
    if (id <= 3) {
      alert('Impossible de supprimer les postes principaux');
      return;
    }

    if (window.confirm('Etes-vous sur de vouloir supprimer ce poste?')) {
      setLoading(true);
      try {
        await governanceService.delete(id);
        await loadPositions();
        alert('Poste supprime avec succes!');
      } catch (error) {
        alert('Erreur lors de la suppression du poste');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="governance-container">
      <h2>Structure de Gouvernance - ASAA</h2>
      <p className="subtitle">Association des Serviteurs d'Allah Azawajal</p>

      {isAdmin && (
        <div className="admin-controls">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-position-btn"
          >
            {showAddForm ? 'Annuler' : 'Ajouter un nouveau poste'}
          </button>
        </div>
      )}

      {isAdmin && showAddForm && (
        <div className="add-form-container">
          <h3>Ajouter un nouveau poste</h3>
          <div className="form-group">
            <label>Nom du poste *</label>
            <input
              type="text"
              placeholder="Ex: Delegue Jeunesse"
              value={newPosition.position_name}
              onChange={(e) => setNewPosition({ ...newPosition, position_name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Type de poste *</label>
            <input
              type="text"
              placeholder="Ex: delegue_jeunesse"
              value={newPosition.position_type}
              onChange={(e) => setNewPosition({ ...newPosition, position_type: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Description du role et des responsabilites"
              value={newPosition.description}
              onChange={(e) => setNewPosition({ ...newPosition, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Nom du titulaire</label>
            <input
              type="text"
              placeholder="Laissez vide pour 'A pourvoir'"
              value={newPosition.holder_name}
              onChange={(e) => setNewPosition({ ...newPosition, holder_name: e.target.value || 'A pourvoir' })}
            />
          </div>
          <div className="form-group">
            <label>Contact</label>
            <input
              type="text"
              placeholder="Numero de telephone"
              value={newPosition.holder_contact}
              onChange={(e) => setNewPosition({ ...newPosition, holder_contact: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Email du titulaire</label>
            <input
              type="email"
              placeholder="Email du responsable"
              value={newPosition.holder_email}
              onChange={(e) => setNewPosition({ ...newPosition, holder_email: e.target.value })}
            />
          </div>
          <div className="button-group">
            <button
              onClick={handleAddPosition}
              disabled={loading}
              className="save-btn"
            >
              Creer le poste
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="cancel-btn"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="governance-grid">
        {positions.map((position) => (
          <div key={position.id} className="position-card">
            {editingId === position.id ? (
              <div className="edit-form">
                <h3>{position.position_name}</h3>
                <div className="form-group">
                  <label>Nom du titulaire</label>
                  <input
                    type="text"
                    value={editData.holder_name}
                    onChange={(e) => setEditData({ ...editData, holder_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input
                    type="text"
                    value={editData.holder_contact || ''}
                    onChange={(e) => setEditData({ ...editData, holder_contact: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editData.holder_email || ''}
                    onChange={(e) => setEditData({ ...editData, holder_email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  />
                </div>
                <div className="button-group">
                  <button
                    onClick={() => handleSave(position.id)}
                    disabled={loading}
                    className="save-btn"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={handleCancel}
                    className="cancel-btn"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3>{position.position_name}</h3>
                <p className="holder-name">
                  {position.holder_name === 'A pourvoir' ? (
                    <span className="vacant">A pourvoir</span>
                  ) : (
                    position.holder_name
                  )}
                </p>
                {position.holder_contact && (
                  <p className="holder-email">{position.holder_contact}</p>
                )}
                {position.holder_email && (
                  <p className="holder-email">{position.holder_email}</p>
                )}
                <p className="description">{position.description}</p>

                {isAdmin && (
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEdit(position)}
                      className="edit-btn"
                    >
                      Modifier
                    </button>
                    {position.id > 3 && (
                      <button
                        onClick={() => handleDeletePosition(position.id)}
                        className="delete-btn"
                        disabled={loading}
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Governance;

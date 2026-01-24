import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Events.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const normalizeImageUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('/uploads/')) {
    return `${API_URL}${url}`;
  }
  return url;
};

const Events = ({ isAdmin }) => {
  const [events, setEvents] = useState([]);
  const [futureEvents, setFutureEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [view, setView] = useState('future'); // future, past, admin
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    image: ''
  });

  // Charger les événements
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const future = await axios.get(`${API_URL}/api/events`);
      const past = await axios.get(`${API_URL}/api/events/past`);
      setFutureEvents(future.data);
      setPastEvents(past.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API_URL}/api/events`, {
        ...formData
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      setFormData({
        title: '',
        description: '',
        date: '',
        location: '',
        image: ''
      });
      setShowForm(false);
      loadEvents();
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la création de l\'événement');
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Êtes-vous sûr?')) {
      try {
        await axios.delete(`${API_URL}/api/events/${eventId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        loadEvents();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const EventCard = ({ event, isPast }) => (
    <div className="event-card">
      {event.image && (
        <div className="event-image">
          <img src={normalizeImageUrl(event.image)} alt={event.title} />
        </div>
      )}
      <div className="event-content">
        <h3>{event.title}</h3>
        <p className="event-date">
          📅 {new Date(event.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        <p className="event-location">📍 {event.location}</p>
        <p className="event-description">{event.description}</p>
        
        {isAdmin && (
          <button 
            className="btn-delete"
            onClick={() => handleDelete(event.id)}
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="events-container">
      <div className="events-header">
        <h2>📅 Événements ASAA</h2>
        <p>Les événements professionnels de la formation</p>
      </div>

      <div className="events-tabs">
        <button 
          className={`tab ${view === 'future' ? 'active' : ''}`}
          onClick={() => setView('future')}
        >
          À Venir ({futureEvents.length})
        </button>
        <button 
          className={`tab ${view === 'past' ? 'active' : ''}`}
          onClick={() => setView('past')}
        >
          Passés ({pastEvents.length})
        </button>
        {isAdmin && (
          <button 
            className={`tab ${view === 'admin' ? 'active' : ''}`}
            onClick={() => setView('admin')}
          >
            Gérer
          </button>
        )}
      </div>

      {view === 'future' && (
        <div className="events-list">
          {futureEvents.length > 0 ? (
            futureEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <p className="no-events">Aucun événement prévu</p>
          )}
        </div>
      )}

      {view === 'past' && (
        <div className="events-list">
          {pastEvents.length > 0 ? (
            pastEvents.map(event => (
              <EventCard key={event.id} event={event} isPast={true} />
            ))
          ) : (
            <p className="no-events">Aucun événement passé</p>
          )}
        </div>
      )}

      {view === 'admin' && isAdmin && (
        <div className="admin-events">
          <button 
            className="btn-add-event"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '❌ Annuler' : '➕ Ajouter un événement'}
          </button>

          {showForm && (
            <form className="event-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Titre"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              ></textarea>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Lieu"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required
              />
              <input
                type="url"
                placeholder="URL de l'image"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
              />
              <button type="submit" className="btn-submit">Créer l'événement</button>
            </form>
          )}

          <div className="admin-events-list">
            <h3>Tous les événements</h3>
            {[...futureEvents, ...pastEvents].map(event => (
              <div key={event.id} className="admin-event-item">
                <h4>{event.title}</h4>
                <p>{new Date(event.date).toLocaleDateString('fr-FR')}</p>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(event.id)}
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;

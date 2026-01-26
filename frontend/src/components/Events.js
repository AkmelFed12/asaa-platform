import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PhotoUpload from './PhotoUpload';
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
  const [view, setView] = useState('future'); // future, past, calendar, admin
  const [showForm, setShowForm] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [eventPhotoPreview, setEventPhotoPreview] = useState('');
  const [eventPhotoUrl, setEventPhotoUrl] = useState('');
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
      setEventPhotoPreview('');
      setEventPhotoUrl('');
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

  const handleEventPhotoUpload = (data) => {
    const photo = Array.isArray(data) ? data[0] : data;
    if (!photo) return;
    setEventPhotoUrl(photo.url || '');
    setEventPhotoPreview(photo.dataUrl || photo.url || '');
    if (photo.url) {
      setFormData((prev) => ({ ...prev, image: photo.url }));
    }
  };

  const escapeHtml = (value) => (
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  );

  const exportPdf = () => {
    const list = view === 'past'
      ? pastEvents
      : view === 'future'
        ? futureEvents
        : [...futureEvents, ...pastEvents];
    const rows = list.map((event) => (
      `<tr>
        <td>${escapeHtml(event.title)}</td>
        <td>${escapeHtml(new Date(event.date).toLocaleDateString('fr-FR'))}</td>
        <td>${escapeHtml(event.location)}</td>
      </tr>`
    )).join('');

    const html = `
      <html>
        <head>
          <title>Evenements ASAA</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { color: #2d7a3a; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f0f9f6; }
          </style>
        </head>
        <body>
          <h1>Evenements ASAA</h1>
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Date</th>
                <th>Lieu</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="3">Aucun evenement</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const getMonthLabel = (date) => (
    date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  );

  const getCalendarDays = () => {
    const start = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const end = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const startDay = start.getDay() || 7;
    const days = [];

    for (let i = 1; i < startDay; i += 1) {
      days.push(null);
    }
    for (let d = 1; d <= end.getDate(); d += 1) {
      days.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d));
    }
    return days;
  };

  const allEvents = [...futureEvents, ...pastEvents];
  const eventsByDate = allEvents.reduce((acc, event) => {
    const key = new Date(event.date).toISOString().split('T')[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

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
        <button className="btn-export" onClick={exportPdf}>Exporter PDF</button>
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
        <button
          className={`tab ${view === 'calendar' ? 'active' : ''}`}
          onClick={() => setView('calendar')}
        >
          Calendrier
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
              <PhotoUpload onUploadSuccess={handleEventPhotoUpload} />
              {eventPhotoPreview && (
                <div className="event-upload-preview">
                  <img src={normalizeImageUrl(eventPhotoPreview)} alt="Aperçu" />
                </div>
              )}
              {eventPhotoUrl && (
                <button
                  type="button"
                  className="btn-submit"
                  onClick={() => setFormData((prev) => ({ ...prev, image: eventPhotoUrl }))}
                >
                  Enregistrer la photo
                </button>
              )}
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

      {view === 'calendar' && (
        <div className="events-calendar">
          <div className="calendar-header">
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
            >
              ←
            </button>
            <h3>{getMonthLabel(calendarMonth)}</h3>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
            >
              →
            </button>
          </div>
          <div className="calendar-grid">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
              <div key={day} className="calendar-day-name">{day}</div>
            ))}
            {getCalendarDays().map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="calendar-cell empty" />;
              const key = day.toISOString().split('T')[0];
              const dayEvents = eventsByDate[key] || [];
              return (
                <div key={key} className="calendar-cell">
                  <div className="calendar-date">{day.getDate()}</div>
                  {dayEvents.map((event) => (
                    <div key={event.id} className="calendar-event">
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;

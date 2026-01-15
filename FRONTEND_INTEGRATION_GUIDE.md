# 🎯 Guide d'Intégration Frontend v2.1

## Étape 1: Intégrer QuizLive dans App.js

### Avant (App.js actuelle)
```javascript
import Quiz from './components/Quiz';

<Route path="/quiz" element={<Quiz />} />
```

### Après (Avec QuizLive)
```javascript
import QuizLive from './components/QuizLive';
import './styles/QuizLive.css';

// Dans les routes:
<Route path="/quiz" element={<QuizLive />} />
// Ou garder les deux pour compatibilité:
<Route path="/quiz-new" element={<QuizLive />} />
```

---

## Étape 2: Intégrer PhotoUpload dans Events.js

### Ajouter le composant
```javascript
import PhotoUpload from './PhotoUpload';
import '../styles/PhotoUpload.css';

// Dans le formulaire d'événement:
<PhotoUpload 
  eventId={currentEvent?.id}
  onUploadSuccess={(photo) => {
    console.log('Photo uploaded:', photo);
    // Recharger galerie des photos
  }}
/>
```

---

## Étape 3: Configurer les variables d'environnement

### `frontend/.env`
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEBSOCKET_URL=ws://localhost:5000
```

### `frontend/.env.production`
```env
REACT_APP_API_URL=https://asaa-platform-production.up.railway.app
REACT_APP_WEBSOCKET_URL=wss://asaa-platform-production.up.railway.app
```

---

## Étape 4: Utiliser useWebSocket Hook

### Example 1: Dans un composant avec leaderboard
```javascript
import { useWebSocket } from '../hooks/useWebSocket';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  
  const { connected, data } = useWebSocket(null, {
    autoJoinRooms: ['leaderboard-daily'],
    onMessage: (msg) => {
      if (msg.type === 'LEADERBOARD_UPDATE') {
        setLeaderboard(prev => [...prev, msg.payload]);
      }
    }
  });

  return (
    <div>
      {connected ? '✅ En direct' : '⚠️ Offline'}
      {leaderboard.map(entry => (
        <div key={entry.name}>
          {entry.rank}. {entry.name} - {entry.score}pts
        </div>
      ))}
    </div>
  );
};
```

### Example 2: Quiz avec WebSocket
```javascript
import { useWebSocket } from '../hooks/useWebSocket';

const Quiz = () => {
  const { connected, joinRoom, send } = useWebSocket(null, {
    autoJoinRooms: ['quiz-daily']
  });

  const handleQuizComplete = (score) => {
    // Envoyer mise à jour
    send('QUIZ_UPDATE', {
      score,
      userId: currentUser.id,
      timestamp: new Date()
    });
  };

  return (
    <div>
      Connection: {connected ? '🟢' : '🔴'}
    </div>
  );
};
```

---

## Étape 5: Mettre à jour l'API Client

### `frontend/src/services/api.js`
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Photos
export const uploadPhoto = async (file, eventId = null) => {
  const formData = new FormData();
  formData.append('photo', file);

  const endpoint = eventId
    ? `/api/photos/event/${eventId}/photo`
    : '/api/photos/upload';

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    body: formData
  });
  return response.json();
};

export const getEventPhotos = async (eventId) => {
  const response = await fetch(`${API_URL}/api/photos/event/${eventId}/photos`);
  return response.json();
};

export const deletePhoto = async (photoId) => {
  const response = await fetch(`${API_URL}/api/photos/photo/${photoId}`, {
    method: 'DELETE'
  });
  return response.json();
};

// Quiz
export const getQuizDaily = async () => {
  const response = await fetch(`${API_URL}/api/quiz/daily/quiz`);
  return response.json();
};

export const startQuizDaily = async (userId, name, email) => {
  const response = await fetch(`${API_URL}/api/quiz/daily/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name, email })
  });
  return response.json();
};

export const submitQuizAnswer = async (userId, questionIndex, selectedIndex) => {
  const response = await fetch(`${API_URL}/api/quiz/daily/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, questionIndex, selectedIndex })
  });
  return response.json();
};

export const completeQuizDaily = async (userId) => {
  const response = await fetch(`${API_URL}/api/quiz/daily/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  return response.json();
};
```

---

## Étape 6: Tester en Local

### Terminal 1: Backend
```bash
cd backend
npm install  # Si nécessaire
node index.js
# 🚀 ASAA Server running on port 5000
```

### Terminal 2: Frontend
```bash
cd frontend
npm install  # Si nécessaire
npm start
# http://localhost:3000
```

### Test endpoints
```bash
# Upload photo
curl -X POST http://localhost:5000/api/photos/upload \
  -F "photo=@~/Desktop/image.jpg"

# Get quiz
curl http://localhost:5000/api/quiz/daily/quiz

# Health check
curl http://localhost:5000/health
```

---

## Étape 7: Déployer en Production

### Backend (Railway)
```bash
cd backend
# Les changements sont en attente de déploiement
git push origin main
# Railway redéploye automatiquement
```

**Vérifier deployment**: https://dashboard.railway.app

### Frontend (Netlify)
```bash
cd frontend
npm run build
# Netlify se redéploie automatiquement depuis GitHub
```

**Vérifier deployment**: https://app.netlify.com

---

## 📋 Checklist Intégration

- [ ] Étape 1: QuizLive intégré dans App.js
- [ ] Étape 2: PhotoUpload intégré dans Events.js
- [ ] Étape 3: Variables d'env configurées
- [ ] Étape 4: useWebSocket utilisé dans composants
- [ ] Étape 5: API client mise à jour
- [ ] Étape 6: Tests en local ✅
- [ ] Étape 7: Déployer en production
- [ ] Vérifier backend déployé: `curl https://asaa-platform-production.up.railway.app/health`
- [ ] Vérifier frontend déployé: https://asaa-platform.netlify.app
- [ ] WebSocket en production: `wss://asaa-platform-production.up.railway.app`

---

## 🚀 Quick Test: WebSocket Live

Après déploiement, ouvrir DevTools > Console:

```javascript
// Se connecter
const ws = new WebSocket('wss://asaa-platform-production.up.railway.app');

ws.onopen = () => {
  console.log('Connected!');
  // Rejoindre room
  ws.send(JSON.stringify({ type: 'JOIN_ROOM', room: 'leaderboard-daily' }));
};

ws.onmessage = (event) => {
  console.log('Message:', JSON.parse(event.data));
};
```

---

## 🔧 Troubleshooting

### WebSocket ne se connecte pas
1. Vérifier backend tourne: `curl http://localhost:5000/health`
2. Vérifier port 5000 disponible
3. Vérifier CORS: `curl -H "Origin: http://localhost:3000" http://localhost:5000/health -v`

### Photos ne s'uploadent pas
1. Vérifier dossier `/backend/uploads/photos` existe
2. Vérifier permissions écriture: `ls -la backend/uploads/`
3. Vérifier taille fichier < 5MB
4. Logs: `node index.js` affiche erreurs upload

### Emails ne sont pas envoyés
1. Vérifier `.env`: EMAIL_USER, EMAIL_PASSWORD
2. Vérifier Gmail: Activer "Less secure apps"
3. Ou utiliser "App Password" (plus sûr)
4. Logs: Vérifier messages dans console serveur

### Quiz ne démarre pas
1. Vérifier `/api/quiz/daily/quiz` répond
2. Vérifier userId fourni au start
3. Vérifier attemptId retourné du start
4. Logs: DevTools Network tab

---

## 📚 Documentation Complète

- `ADVANCED_FEATURES.md` - Features détaillées
- `INTEGRATION_REPORT.md` - Architecture complète
- Ce fichier - Frontend integration guide

---

**Prêt pour intégration?** 🎉

Une fois ces étapes complétées:
1. Git push
2. Netlify redéploie automatiquement
3. Railway redéploie automatiquement
4. New features en prod! 🚀

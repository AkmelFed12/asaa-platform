# 🚀 Nouvelles Fonctionnalités - ASAA Platform v2.1

## 📧 Système de Notifications Email

### Configuration
Les notifications email utilisent nodemailer avec support pour:
- Gmail (avec App Password)
- SendGrid
- Mailgun
- Tout service SMTP

### Variables d'Environnement
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=ASAA Platform <notifications@asaa.com>
APP_URL=https://asaa-platform.netlify.app
```

### Types de Notifications

#### 1. Quiz Quotidien
```javascript
sendQuizNotification(userEmail, userName, {
  score: 18,
  total: 20,
  percentage: 90,
  level: "Expert",
  rank: 3
});
```
📧 Envoie les résultats avec:
- Score et pourcentage
- Niveau atteint
- Rang dans le leaderboard
- Lien vers classement complet

#### 2. Bienvenue Utilisateur
```javascript
sendWelcomeEmail(userEmail, userName, tempPassword);
```
📧 Envoie les identifiants avec:
- Email de connexion
- Mot de passe temporaire
- Alerter sur changement MDP
- Lien vers la plateforme

#### 3. Notification Événement
```javascript
sendEventNotification(userEmail, userName, {
  title: "Formation Leadership",
  description: "Session avancée...",
  date: "2026-02-15",
  location: "Salle principale",
  image: "https://..."
});
```
📧 Envoie les détails avec:
- Titre et description
- Date et lieu
- Image de l'événement
- Lien pour consulter

### Usage dans Routes

```javascript
// Dans routes/quiz.js - Après quiz complété
const { sendQuizNotification } = require('../utils/emailService');

router.post('/daily/complete', (req, res) => {
  // ... calcul scores ...
  
  // Envoyer email
  sendQuizNotification(user.email, user.name, quizStats);
  
  res.json(results);
});
```

---

## 🔄 WebSocket - Temps Réel

### Initialisation

```javascript
// Dans index.js
const http = require('http');
const wsManager = require('./src/utils/websocketManager');

const server = http.createServer(app);
wsManager.initialize(server);

server.listen(PORT, () => {
  console.log(`Serveur sur port ${PORT}`);
});
```

### Types de Messages

#### Rejoindre une Room
```javascript
{
  type: 'JOIN_ROOM',
  room: 'quiz-daily-2026-01-15'
}
```

#### Mise à Jour Quiz
```javascript
{
  type: 'QUIZ_UPDATE',
  room: 'quiz-daily',
  payload: {
    userId: 123,
    questionNumber: 5,
    answered: true,
    points: 5
  }
}
```

#### Mise à Jour Leaderboard
```javascript
{
  type: 'LEADERBOARD_UPDATE',
  room: 'leaderboard-daily',
  payload: {
    rank: 1,
    name: "User Name",
    score: 18,
    percentage: 90
  }
}
```

#### Événement Créé
```javascript
{
  type: 'EVENT_CREATED',
  payload: {
    id: 1,
    title: "New Event",
    date: "2026-02-15",
    location: "Room"
  }
}
```

### Frontend - Client WebSocket

```javascript
// React Component
import { useEffect, useState } from 'react';

const QuizLive = () => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('wss://asaa-platform-production.up.railway.app');

    ws.onopen = () => {
      // Rejoindre la room quiz
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        room: 'leaderboard-daily'
      }));
    };

    ws.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);
      
      if (type === 'LEADERBOARD_UPDATE') {
        setLeaderboard(prev => [...prev, payload]);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div>
      {leaderboard.map((entry, idx) => (
        <div key={idx}>{entry.rank}. {entry.name} - {entry.score}</div>
      ))}
    </div>
  );
};
```

---

## 📸 Upload de Photos

### Installation
```bash
npm install multer sharp
```

### Endpoints Photos

#### Upload Une Photo
```
POST /api/photos/upload
Content-Type: multipart/form-data

Form:
  - photo: <file>
```

Response:
```json
{
  "message": "Photo uploadée avec succès",
  "photo": {
    "id": 1234567890,
    "filename": "photo-1234567890-xxx.jpg",
    "url": "/uploads/photos/photo-xxx.jpg",
    "size": 2048576,
    "uploadedAt": "2026-01-15T20:00:00Z"
  }
}
```

#### Upload Plusieurs Photos
```
POST /api/photos/upload-multiple
Content-Type: multipart/form-data

Form:
  - photos: <file1>
  - photos: <file2>
  - photos: <file3>
```

#### Associer Photo à Événement
```
POST /api/photos/event/:eventId/photo
Content-Type: multipart/form-data

Form:
  - photo: <file>
```

#### Obtenir Photos d'Événement
```
GET /api/photos/event/:eventId/photos
```

Response:
```json
{
  "eventId": "123",
  "photos": [
    {
      "id": 1,
      "filename": "photo-xxx.jpg",
      "url": "/uploads/photos/photo-xxx.jpg",
      "uploadedAt": "2026-01-15"
    }
  ],
  "count": 1
}
```

#### Supprimer Photo
```
DELETE /api/photos/photo/:photoId
```

#### Statistiques Upload
```
GET /api/photos/stats
```

Response:
```json
{
  "totalPhotos": 45,
  "totalSize": 104857600,
  "totalSizeMB": "100.00",
  "eventCount": 12
}
```

### Usage dans Events Component

```javascript
import { useState } from 'react';

const EventForm = () => {
  const [photo, setPhoto] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 5MB)');
      return;
    }
    setPhoto(file);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('photo', photo);

    const response = await fetch('/api/photos/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    return data.photo.url;
  };

  return (
    <form>
      <input type="file" onChange={handlePhotoChange} accept="image/*" />
      <img src={photo} alt="Preview" />
    </form>
  );
};
```

---

## 📱 Application Mobile - React Native

### Architecture

```
mobile/
├── app.json                 # Configuration Expo
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx       # Quiz screen
│   │   ├── events.tsx      # Events screen
│   │   └── governance.tsx  # Governance screen
│   ├── auth/
│   │   └── login.tsx       # Login screen
│   └── context/
│       └── AuthContext.tsx # Auth management
├── components/
│   ├── QuizCard.tsx
│   ├── EventCard.tsx
│   └── LeaderboardItem.tsx
├── utils/
│   ├── api.ts              # API client
│   └── storage.ts          # Local storage
└── package.json
```

### Setup

```bash
npx create-expo-app asaa-mobile
cd asaa-mobile
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install @react-native-async-storage/async-storage
npm install axios
npx expo start
```

### Configuration API Client

```typescript
// utils/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://asaa-platform-production.up.railway.app';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

// Interceptor pour token JWT
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### Authentification Locale

```typescript
// context/AuthContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const response = await apiClient.get('/api/users/me');
        setUser(response.data);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await apiClient.post('/api/auth/login', { email, password });
    const { token, user } = response.data;
    await AsyncStorage.setItem('authToken', token);
    setUser(user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Quiz Screen Mobile

```typescript
// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import apiClient from '../../utils/api';

export default function QuizScreen() {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(10);

  useEffect(() => {
    loadQuiz();
  }, []);

  useEffect(() => {
    if (time === 0) {
      handleNext();
    }
    const timer = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(timer);
  }, [time]);

  const loadQuiz = async () => {
    try {
      const response = await apiClient.get('/api/quiz/daily/quiz');
      setQuiz(response.data);
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTime(10);
    }
  };

  if (!quiz) return <Text>Loading...</Text>;

  const question = quiz.questions[currentQuestion];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quiz ASAA</Text>
        <View style={styles.timer}>
          <Text style={[styles.timerText, time <= 3 && styles.timerWarning]}>
            {time}s
          </Text>
        </View>
      </View>

      <View style={styles.progress}>
        <Text>{currentQuestion + 1}/{quiz.questions.length}</Text>
      </View>

      <Text style={styles.question}>{question.question}</Text>

      {question.options.map((option, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.optionButton}
          onPress={() => {
            if (idx === question.correct) setScore(score + 1);
            handleNext();
          }}
        >
          <Text style={styles.optionText}>{option}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.score}>Score: {score}/{quiz.questions.length}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea'
  },
  timer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center'
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white'
  },
  timerWarning: {
    color: '#ff4757'
  },
  progress: {
    marginBottom: 20,
    textAlign: 'center'
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333'
  },
  optionButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ddd'
  },
  optionText: {
    fontSize: 16,
    color: '#333'
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginTop: 20,
    textAlign: 'center'
  }
});
```

---

## 📚 Documentation API Complète

### Endpoints Totaux
```
Quiz:          6 endpoints
Événements:    5 endpoints
Utilisateurs:  4 endpoints
Auth:          3 endpoints
Photos:        6 endpoints
Websocket:     5 types messages
─────────────────────────────
Total:         29 endpoints API
```

### Status Production
- ✅ Backend: https://asaa-platform-production.up.railway.app
- ✅ Frontend: https://asaa-platform.netlify.app
- ✅ Emails: Nodemailer configuré
- ✅ WebSocket: Prêt pour temps réel
- ✅ Photos: Multer configuré
- 📱 Mobile: Prêt pour développement

---

**Version**: 2.1.0  
**Date**: 15 janvier 2026  
**Status**: ✅ Advanced Features Ready

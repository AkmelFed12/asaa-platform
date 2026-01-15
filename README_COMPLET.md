# 🌟 ASAA Platform - Complete Application

**ASAA Platform** - Association des Serviteurs d'Allah Azawajal - Plateforme complète de gestion, coordination et apprentissage islamique.

## ✨ Features Complètes

### 📚 Quiz Islamique Quotidien
- **20 questions quotidiennes** générées automatiquement à 20h00
- **10 secondes par question** avec timer animé
- **4 niveaux de difficulté** : Débutant, Intermédiaire, Avancé, Expert
- **Classement en temps réel** avec leaderboard quotidien
- **Système de scoring** avec évolution de niveau

### 📅 Gestion des Événements  
- **Création d'événements** (Admin uniquement)
- **Affichage avec images** (URLs ou base64)
- **Calendrier** des événements à venir
- **Historique** des événements passés
- **Modification et suppression** des événements

### 🔧 Panneau d'Administration
- **Gestion des utilisateurs**
- **Création de comptes** (Admin uniquement)
- **Réinitialisation des mots de passe**
- **Contrôle des rôles** (Admin/Membre)
- **Journaux d'activité** et statistiques

### 🏛️ Gouvernance
- **Structure organisationnelle** complète
- **Gestion des délégations**
- **Système de rôles** et responsabilités
- **Prise de décision collaborative**

### 🔐 Sécurité & Authentification
- **Authentification JWT** sécurisée
- **Hachage des mots de passe**
- **Contrôle d'accès** basé sur les rôles
- **Gestion des sessions** utilisateur

## 🚀 Déploiement

### URLs en Production
- **Frontend**: https://asaa-platform.netlify.app
- **Backend API**: https://asaa-platform-production.up.railway.app

### Identifiants de Test
```
Admin:
  Email: admin@asaa.com
  Password: admin123

Membre:
  Email: member@asaa.com
  Password: member123
```

## 📁 Structure du Projet

```
asaa-platform/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── quiz.js
│   │   │   ├── events.js
│   │   │   ├── governance.js
│   │   │   └── ...
│   │   ├── utils/
│   │   │   ├── quizEngine.js (Générateur de questions quotidien)
│   │   │   └── ...
│   │   └── middleware/
│   ├── index.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── QuizNew.js (Quiz quotidien amélioré)
│   │   │   ├── Events.js
│   │   │   ├── Admin.js
│   │   │   ├── Governance.js
│   │   │   ├── Footer.js
│   │   │   └── Auth.js
│   │   ├── styles/
│   │   │   ├── Quiz.css
│   │   │   ├── Events.css
│   │   │   ├── Admin.css
│   │   │   ├── Footer.css
│   │   │   └── ...
│   │   └── App.js
│   └── package.json
│
└── database/
    └── schema.sql
```

## 🛠️ Technologies

### Backend
- **Node.js** avec Express.js
- **CORS** pour les requêtes cross-origin
- **Helmet** pour la sécurité HTTP
- **dotenv** pour la configuration
- **JWT** pour l'authentification

### Frontend
- **React 18** avec Hooks
- **Axios** pour les requêtes API
- **CSS3** avec gradients et animations
- **Responsive Design** (Mobile-first)

### Déploiement
- **Railway** pour le backend (Node.js)
- **Netlify** pour le frontend (React)
- **GitHub** pour le versioning

## 🚀 Installation Locale

### Backend
```bash
cd backend
npm install
npm start
# Serveur sur http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm start
# Application sur http://localhost:3000
```

## 📊 API Endpoints

### Quiz
```
GET  /api/quiz/daily/quiz           - Obtenir les 20 questions du jour
POST /api/quiz/daily/start          - Démarrer une tentative
POST /api/quiz/daily/answer         - Soumettre une réponse
POST /api/quiz/daily/complete       - Terminer le quiz
GET  /api/quiz/daily/leaderboard    - Obtenir le classement
GET  /api/quiz/daily/result/:userId - Résultat de l'utilisateur
```

### Événements
```
GET    /api/events              - Événements à venir
GET    /api/events/past         - Événements passés
POST   /api/events              - Créer un événement (Admin)
PUT    /api/events/:id          - Modifier un événement (Admin)
DELETE /api/events/:id          - Supprimer un événement (Admin)
```

### Utilisateurs
```
POST   /api/users/register      - Créer un utilisateur (Admin)
GET    /api/users               - Lister les utilisateurs
PUT    /api/users/:id           - Modifier un utilisateur
DELETE /api/users/:id           - Supprimer un utilisateur
```

### Authentification
```
POST   /api/auth/login          - Connexion
POST   /api/auth/logout         - Déconnexion
```

## 💾 Données

### Stockage Actuel
- **En-mémoire** : Les données persistent pendant la session
- **Réinitialisation quotidienne** du quiz à 20h00 UTC
- **Leaderboard remis à zéro** chaque jour

### Stockage Futur (PostgreSQL)
Les données seront persistantes dans une base PostgreSQL pour la production.

## 🎯 Fonctionnalités Quiz Avancées

### Générateur de Questions
- **20 questions** générées chaque jour
- **Aléatoire déterministe** : Les mêmes questions toute la journée
- **Nouvelle sélection** chaque jour à 20h00
- **6 catégories** : Coran, Hadiths, Histoire, Pratiques, Éthique, Savants

### Système de Niveaux
- **Débutant** : 0-5 réponses correctes
- **Intermédiaire** : 6-12 réponses correctes
- **Avancé** : 13-17 réponses correctes
- **Expert** : 18-20 réponses correctes

### Leaderboard
- **Mis à jour en temps réel**
- **Classement par score** et pourcentage
- **Médailles** : 🥇 🥈 🥉
- **Réinitialisé** chaque jour à 20h00

## 📱 Responsive Design

L'application est entièrement responsive :
- ✅ Desktop (1200px+)
- ✅ Tablette (768px-1199px)
- ✅ Mobile (480px-767px)
- ✅ Petit mobile (<480px)

## 🔐 Sécurité

- ✅ JWT tokens pour l'authentification
- ✅ Hachage des mots de passe
- ✅ HTTPS en production
- ✅ Validation des entrées
- ✅ CORS configuré
- ✅ Admin-only pour les opérations sensibles

## 📝 Notes de Déploiement

### Railway (Backend)
- Auto-redéploiement à chaque push Git
- Variables d'environnement configurées
- Logs en temps réel disponibles
- Redémarrage automatique

### Netlify (Frontend)
- Build automatique à chaque commit
- Pre-rendering for SEO
- CDN global
- Redirection de domaine possible

## 🤝 Support

Pour toute question ou problème :
1. Vérifiez la console navigateur (F12)
2. Consultez les logs backend
3. Testez les endpoints API directement

## 📄 Licence

© 2026 LMO CORP - Tous droits réservés.

**Slogan ASAA**: *La formation est notre priorité*

---

**Version**: 2.0  
**Dernière mise à jour**: 15 janvier 2026  
**Statut**: ✅ Production Live

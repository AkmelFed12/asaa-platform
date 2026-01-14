# ASAA - Association des Serviteurs d'Allah Azawajal

Plateforme de gestion complète pour ASAA avec authentification, interfaces différenciées, gestion des postes de gouvernance, inscription des membres, et quiz islamique interactif.

## Structure Organisationnelle

- **Président**
- **Vice-Président**
- **Secrétaire Général**
- **Secrétaires Adjointes** (Délégués):
  - Délégué à la Mobilisation
  - Délégué Social
  - Délégué Culturel
  - Délégué aux Événements
  - Autres délégations

## Fonctionnalités

- **Gestion des Membres**: Annuaire complet des membres et délégués
- **Gestion des Événements**: Organisation et suivi des événements culturels et religieux
- **Communication**: Notifications et communications internes
- **Administration**: Gestion des rôles et permissions
- **Rapports**: Génération de rapports d'activités
- **Interface Responsive**: Accès depuis ordinateur et mobile

## Architecture Technique

- **Backend**: Express.js REST API avec authentification JWT
- **Frontend**: React avec interface moderne et réactive
- **Database**: PostgreSQL pour la persistance des données
- **Authentification**: JWT-based authentication
- **Déploiement**: Support Docker Compose

## Prérequis

- Node.js 16.x ou supérieur
- npm 8.x ou supérieur
- PostgreSQL 12.x ou supérieur
- Git

## Installation

### 1. Cloner le repository
```bash
git clone <repository-url>
cd asaa-application
```

### 2. Installer les dépendances du backend
```bash
cd backend
npm install
```

### 3. Installer les dépendances du frontend
```bash
cd frontend
npm install
```

### 4. Configurer les variables d'environnement

Créer les fichiers `.env` dans les répertoires backend et frontend:

**Backend (.env)**:
```
PORT=5000
DATABASE_URL=postgresql://asaa_user:asaa_password@localhost:5432/asaa_db
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

**Frontend (.env)**:
```
REACT_APP_API_URL=http://localhost:5000
```

### 5. Initialiser la base de données
```bash
cd database
psql -U postgres -f schema.sql
```

## Lancer l'Application

### Mode Développement

Démarrer backend et frontend ensemble:
```bash
npm start
```

Ou les démarrer séparément:
```bash
npm run start:backend
npm run start:frontend
```

### Build Production
```bash
npm run build
```

## Avec Docker Compose

```bash
docker-compose up
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:5432

## Structure du Projet

```
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── members.js
│   │   │   ├── events.js
│   │   │   └── roles.js
│   │   ├── controllers/
│   │   ├── models/
│   │   └── middleware/
│   ├── package.json
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.js
│   ├── public/
│   └── package.json
├── database/
│   ├── schema.sql
│   └── migrations/
├── docker-compose.yml
└── README.md
```

## Rôles et Permissions

### Rôles Disponibles

1. **Admin**: Accès complet à l'application
2. **Président**: Supervision générale
3. **Vice-Président**: Assistance et relais
4. **Secrétaire Général**: Gestion administrative
5. **Délégué**: Gestion de sa délégation
6. **Membre**: Accès aux informations publiques

## Base de Données

Tables principales:
- **users**: Utilisateurs et délégués
- **members**: Membres de l'association
- **roles**: Définition des rôles
- **delegations**: Délégations (Mobilisation, Social, Culturel, etc.)
- **events**: Événements et activités
- **sessions**: Sessions utilisateur
- **audit_logs**: Journaux d'audit

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/logout` - Déconnexion

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `GET /api/users/:id` - Détails utilisateur
- `POST /api/users` - Créer utilisateur
- `PUT /api/users/:id` - Modifier utilisateur
- `DELETE /api/users/:id` - Supprimer utilisateur

### Membres
- `GET /api/members` - Liste des membres
- `GET /api/members/:id` - Détails membre
- `POST /api/members` - Ajouter membre

### Événements
- `GET /api/events` - Liste des événements
- `POST /api/events` - Créer événement

### Rôles et Délégations
- `GET /api/roles` - Liste des rôles
- `GET /api/delegations` - Liste des délégations

## Support

Pour toute question ou problème, contactez: support@asaa.com

## License

MIT

## Contributeurs

- ASAA Team

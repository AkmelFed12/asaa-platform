# 🎯 Guide d'Accès ASAA Platform - PRODUCTION

## 🚀 Accès Rapide

### Application Live
👉 **https://asaa-platform.netlify.app**

### Backend API
👉 **https://asaa-platform-production.up.railway.app**

---

## 👤 Comptes de Test

### 1️⃣ Compte Admin (Accès Complet)
```
Email: admin@asaa.com
Password: admin123

Permissions:
✅ Créer des utilisateurs
✅ Gérer événements
✅ Voir tableaux de bord admin
✅ Participer aux quiz
✅ Accès gouvernance
```

### 2️⃣ Compte Membre (Accès Standard)
```
Email: member@asaa.com
Password: member123

Permissions:
✅ Participer aux quiz
✅ Voir événements
✅ Voir gouvernance
❌ Créer utilisateurs
❌ Accès admin
```

---

## 📊 Fonctionnalités Principales

### 📚 Quiz Islamique (Quotidien)

**Horaire**: 20h00 UTC chaque jour

**Caractéristiques**:
- 🎯 20 questions générées quotidiennement
- ⏱️ 10 secondes par question (timer auto-avance)
- 🏆 Classement en temps réel
- 📈 Niveaux: Débutant → Expert
- 🥇 Leaderboard avec médailles

**Comment jouer**:
1. Connectez-vous
2. Cliquez sur "📚 Quiz Quotidien"
3. Cliquez "Commencer le Quiz"
4. Répondez avant que le timer n'arrive à 0
5. Consultez votre score et rang

### 📅 Événements

**Pour les Membres**:
- Voir les événements à venir
- Consulter les événements passés
- Voir les images et descriptions

**Pour les Admins** (Admin uniquement):
- Créer des événements
- Ajouter des images (URLs)
- Modifier les détails
- Supprimer les événements

### 🔧 Panneau Admin (Admin uniquement)

**Accès**: Cliquez sur "🔧 Admin" dans la navigation

**Fonctionnalités**:
- 👥 **Utilisateurs**: Créer/supprimer/réinitialiser MDP
- 📋 **Sécurité**: Informations sur les protections
- 📊 **Statistiques**: Utilisateurs, événements, quiz

### 🏛️ Gouvernance

- Structure organisationnelle
- Responsabilités par rôle
- Délégations
- Système de gouvernance

---

## 🎮 Tutoriel Pas à Pas

### Première Connexion

1. Ouvrez https://asaa-platform.netlify.app
2. Remplissez le formulaire:
   ```
   Email: admin@asaa.com
   Password: admin123
   ```
3. Cliquez "Se connecter"
4. ✅ Bienvenue sur ASAA Platform!

### Participer au Quiz

1. Naviguez à "📚 Quiz Quotidien"
2. Lisez les informations:
   - 20 questions
   - 10 secondes chacune
   - Classement quotidien
3. Cliquez le bouton bleu "Commencer"
4. **Pour chaque question**:
   - Lisez bien la question
   - Sélectionnez votre réponse (A, B, C ou D)
   - Le timer compte à rebours
   - La réponse s'envoie automatiquement
5. **À la fin**:
   - Voir votre score final
   - Consulter le leaderboard
   - Voir votre niveau

### Créer un Événement (Admin)

1. Cliquez sur "📅 Événements"
2. Cliquez sur l'onglet "Gérer"
3. Cliquez "➕ Ajouter un événement"
4. Remplissez le formulaire:
   ```
   Titre: (ex: Formation Leadership)
   Description: (détails de l'événement)
   Date: (sélectionnez date et heure)
   Lieu: (où se déroulera l'événement)
   URL Image: (lien vers une image, optionnel)
   ```
5. Cliquez "Créer l'événement"
6. ✅ Événement créé! Il apparaîtra sur "À Venir"

### Gérer les Utilisateurs (Admin)

1. Cliquez sur "🔧 Admin"
2. Vous êtes dans l'onglet "Utilisateurs"
3. **Pour créer**: 
   - Cliquez "➕ Nouvel utilisateur"
   - Remplissez les détails
   - Cliquez "Créer l'utilisateur"
   - Le mot de passe temporaire s'affiche
4. **Pour réinitialiser MDP**:
   - Cliquez 🔑 dans la colonne "Actions"
   - Entrez le nouveau mot de passe
5. **Pour supprimer**:
   - Cliquez 🗑️ dans la colonne "Actions"
   - Confirmez la suppression

---

## 🎨 Interface & Navigation

### Menu Principal
```
Accueil          → Page d'accueil avec info
📚 Quiz Quotidien → Participez au quiz du jour
📅 Événements    → Voir et gérer événements
Gouvernance      → Structure organisation
🔧 Admin         → Panneau admin (admins seulement)
```

### Couleurs & Badges

**Quiz**:
- 🟢 Débutant (0-5 bonnes réponses)
- 🟡 Intermédiaire (6-12 bonnes réponses)
- 🔵 Avancé (13-17 bonnes réponses)
- 🟣 Expert (18-20 bonnes réponses)

**Utilisateurs**:
- 👑 Admin (rouge)
- 👤 Membre (bleu)

**Événements**:
- 📅 À Venir (affichés en premier)
- ✅ Passés (affichés second)

---

## ⚙️ Paramètres & Préférences

### Préférences Compte
- Connectez-vous avec votre email
- Votre nom apparaît en haut

### Déconnexion
- Cliquez "Déconnexion" en haut à droite
- Vous serez redirigé à la page de connexion

---

## 🐛 Troubleshooting

### Je n'arrive pas à me connecter
- ✅ Vérifiez votre email: `admin@asaa.com` ou `member@asaa.com`
- ✅ Vérifiez le mot de passe: `admin123` ou `member123`
- ✅ Consultez la console (F12) pour les erreurs
- ✅ Essayez de rafraîchir la page (F5)

### Le quiz ne charge pas
- ✅ Vérifiez la connexion internet
- ✅ Attendez quelques secondes
- ✅ Rafraîchissez la page
- ✅ Consultez la console (F12)

### Les événements ne s'affichent pas
- ✅ Assurez-vous que vous êtes connecté
- ✅ Attendez que la page charge complètement
- ✅ Essayez un rafraîchissement (F5)

### Je n'ai pas accès au panneau Admin
- ✅ Vérifiez que vous êtes connecté avec `admin@asaa.com`
- ✅ Le bouton "🔧 Admin" n'apparaît que pour les admins
- ✅ Si vous êtes admin et ne le voyez pas, consultez l'onglet "Sécurité"

---

## 📱 Accès Mobile

**L'application est entièrement responsive** et fonctionne sur:
- ✅ Smartphones
- ✅ Tablettes
- ✅ Ordinateurs

**Sur mobile**:
- Navigation en accordéon
- Boutons adaptés au toucher
- Texte lisible à tout zoom
- Pas besoin d'application

---

## 📞 Support

### Signaler un Problème
1. Notez le message d'erreur exacte
2. Ouvrez la console (F12)
3. Copiez le message d'erreur
4. Contactez l'administrateur

### Vérifier l'État du Serveur
Visitez: https://asaa-platform-production.up.railway.app/health

Vous devriez voir:
```json
{
  "status": "Server is running",
  "service": "ASAA API"
}
```

---

## 🔒 Sécurité & Confidentialité

- ✅ Connexion sécurisée (HTTPS)
- ✅ Mots de passe chiffrés
- ✅ Tokens JWT sécurisés
- ✅ Données privées protégées
- ✅ Admin-only pour les opérations sensibles

---

## 📚 Documentation Complète

Pour plus de détails techniques, consultez:
- `README_COMPLET.md` - Documentation technique
- `DEPLOYMENT_VERIFICATION.md` - Checklist complète
- `IMPROVEMENTS_SUMMARY.md` - Résumé des améliorations

---

**Dernière mise à jour**: 15 janvier 2026

**© 2026 LMO CORP**  
*La formation est notre priorité* 🎓

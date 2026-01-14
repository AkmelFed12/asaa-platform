# 👨‍💼 GUIDE ADMINISTRATEUR - ASAA Platform

## Accès Admin

### Identifiants
```
Email: admin@asaa.com
Mot de passe: admin123
```

### Lien Public
```
https://huge-sloths-shake.loca.lt
```

---

## Fonctionnalités Admins

### 1. Gérer la Gouvernance

#### Voir Tous les Postes
1. Connectez-vous (admin@asaa.com / admin123)
2. Cliquez "Structure de Gouvernance"
3. Vous voyez tous les 9+ postes

#### Modifier un Poste
1. Trouvez le poste à modifier
2. Cliquez le bouton "✏️ Modifier"
3. Changez:
   - Nom du titulaire
   - Email du titulaire
   - Description
4. Cliquez "Enregistrer"
5. ✅ Changements immédiatement visibles

#### Ajouter un Poste
1. Cliquez "➕ Ajouter un nouveau poste"
2. Remplissez:
   - **Nom du poste**: ex. "Délégué Jeunesse"
   - **Type de poste**: ex. "delegue_jeunesse"
   - **Description**: Responsabilités du poste
   - **Nom du titulaire**: (optionnel, laissez "À pourvoir")
   - **Email du titulaire**: (optionnel)
3. Cliquez "Créer le poste"
4. ✅ Nouveau poste apparaît dans la grille

#### Supprimer un Poste
1. Trouvez le poste personnalisé (ID > 3)
2. Cliquez le bouton rouge "🗑️ Supprimer"
3. Confirmez la suppression
4. ✅ Poste supprimé

**Note**: Impossible de supprimer les 3 postes principaux (Président, VP, Secrétaire)

### 2. Gérer les Positions Clés

#### Assigner le Président
1. Allez à "Structure de Gouvernance"
2. Cliquez "✏️ Modifier" sur le Président
3. Entrez le nom: ex. "DIARRA SIDI" ✅
4. Entrez l'email: ex. "diarra@asaa.com"
5. Cliquez "Enregistrer"

#### Assigner le Vice-Président
Même processus qu'en haut

#### Assigner le Secrétaire Général
Même processus qu'en haut

### 3. Tableau de Bord Admin

**Cliquez "🔧 Admin"** dans le menu pour accéder à:
- Vue d'ensemble du système
- Lien de gestion de gouvernance
- Actions rapides
- Statistiques (à venir)

---

## Cas d'Usage Courants

### Cas 1: Mettre à Jour le Président
```
Ancien: (vide)
Nouveau: DIARRA SIDI
Email: diarra@asaa.com

Action: Modifier → Enregistrer ✅
```

### Cas 2: Ajouter un Nouveau Poste
```
Nom: Délégué Informatique
Type: delegue_informatique
Description: Gère la transformation digitale
Titulaire: À déterminer

Action: Ajouter → Créer ✅
```

### Cas 3: Réorganiser la Structure
```
1. Ajouter: 3 nouveaux postes
2. Modifier: Assigner les titulaires
3. Supprimer: Anciens postes (si besoin)
4. Résultat: Structure mise à jour ✅
```

---

## Quoi de Nouveau - Version 1.1

✨ **Nouvelles Fonctionnalités Admin**:
- ➕ Créer de nouveaux postes dynamiquement
- ✏️ Modifier les titulaires et descriptions
- 🗑️ Supprimer les postes personnalisés
- 🔒 Protection des postes principaux
- 📱 Interface responsive

---

## Données Actuelles de Gouvernance

| ID | Position | Titulaire | Email | Status |
|----|----------|-----------|-------|--------|
| 1 | Président | DIARRA SIDI | diarra@asaa.com | ✅ |
| 2 | Vice-Président | À pourvoir | - | ⏳ |
| 3 | Secrétaire Général | À pourvoir | - | ⏳ |
| 4 | Délégué Mobilisation | À pourvoir | - | ⏳ |
| 5 | Délégué Social | À pourvoir | - | ⏳ |
| 6 | Délégué Culturel | À pourvoir | - | ⏳ |
| 7 | Délégué Événements | À pourvoir | - | ⏳ |
| 8 | Délégué Communication | À pourvoir | - | ⏳ |
| 9 | Délégué Finance | À pourvoir | - | ⏳ |

---

## Gérer les Quiz

### Voir les Résultats des Quiz
1. **En développement** - Accès aux résultats des quiz à venir

### Leaderboard
- Accédez à "Quiz Islamique"
- Cliquez "Voir le Classement" après un quiz
- Voyez les top 10 des participants

### Questions du Quiz
**Actuellement 20 questions prédéfinies**:
- Quran & Sunnah: 8 questions
- Prophètes & Messagers: 5 questions
- Histoire Islamique: 4 questions
- Principes Islamiques: 3 questions

---

## Gestion des Utilisateurs

### Créer un Nouvel Admin
**À venir** - Actuellement:
```
Email: admin@asaa.com
Mot de passe: admin123
```

### Créer un Nouveau Membre
**À venir** - Actuellement:
```
Email: member@asaa.com
Mot de passe: member123
```

### Réinitialiser les Mots de Passe
**À venir** - Demander au développeur

---

## API Endpoints Disponibles

### Gouvernance
```
GET  /api/governance              # Tous les postes
GET  /api/governance/:id          # Un poste spécifique
PUT  /api/governance/:id          # Modifier un poste
POST /api/governance              # Créer un poste
DELETE /api/governance/:id        # Supprimer un poste
```

### Exemple cURL - Modifier Président
```bash
curl -X PUT http://localhost:5000/api/governance/1 \
  -H "Content-Type: application/json" \
  -d '{
    "holder_name": "DIARRA SIDI",
    "holder_email": "diarra@asaa.com",
    "description": "Responsable de la direction générale"
  }'
```

### Exemple cURL - Ajouter Poste
```bash
curl -X POST http://localhost:5000/api/governance \
  -H "Content-Type: application/json" \
  -d '{
    "position_name": "Délégué Jeunesse",
    "position_type": "delegue_jeunesse",
    "description": "Responsable des programmes jeunesse",
    "holder_name": "À pourvoir"
  }'
```

---

## Bonnes Pratiques

✅ **À Faire**:
- Toujours remplir les champs requis (nom du poste, type)
- Utiliser des descriptions claires et détaillées
- Assigner les titulaires rapidement après création
- Vérifier les emails avant de sauvegarder
- Garder la structure organisée

❌ **À Éviter**:
- Ne pas supprimer les 3 postes principaux
- Ne pas laisser trop de postes "À pourvoir"
- Ne pas utiliser des caractères spéciaux bizarres
- Ne pas modifier les IDs directement
- Ne pas partager les identifiants admin

---

## Troubleshooting Admin

### Problème: Impossible de modifier un poste
**Cause**: Peut-être une erreur réseau
**Solution**: 
1. Vérifiez la connexion
2. Rechargez la page
3. Réessayez la modification

### Problème: "Position not found"
**Cause**: Le poste a peut-être été supprimé
**Solution**:
1. Rafraîchir la liste
2. Vérifier l'ID du poste
3. Créer un nouveau poste si besoin

### Problème: Les changements ne s'affichent pas
**Cause**: Cache navigateur
**Solution**:
1. Ctrl+F5 (recharger dur)
2. Vider le cache
3. Recharger la page

### Problème: "Cannot delete core positions"
**Cause**: Essai de supprimer Président/VP/Secrétaire
**Solution**: 
- Impossible de supprimer les 3 principaux
- Seulement les postes créés peuvent être supprimés (ID > 3)

---

## Statistiques & Reporting

**En développement**:
- Nombre de membres actifs
- Résultats de quiz par période
- Historique des modifications
- Logs d'accès

---

## Sécurité & Permissions

### Permissions Admin
- ✅ Voir tous les postes
- ✅ Modifier n'importe quel poste
- ✅ Créer de nouveaux postes
- ✅ Supprimer les postes personnalisés
- ✅ Voir le panneau admin
- ✅ Participer aux quiz

### Permissions Membre
- ✅ Voir les postes (lecture seule)
- ✅ Participer aux quiz
- ✅ Voir le classement
- ❌ Modifier les postes
- ❌ Accéder à l'admin

---

## Maintenance

### Redémarrage du Serveur
```bash
# Arrêter les serveurs (Ctrl+C dans les terminaux)
# Redémarrer
cd backend && node index.js
cd frontend && npm start
```

### Backup des Données
**Actuellement**: Données en mémoire (perdues au redémarrage)
**Production**: Intégrer une base de données PostgreSQL

### Logs
- Actuellement basiques dans la console
- À améliorer: Ajouter des logs détaillés

---

## Accès Support

Pour les questions techniques:
1. Consultez ce guide
2. Vérifiez les FAQ
3. Contactez le développeur

---

## Version Information

- **Version**: 1.1.0
- **Date**: 13 Janvier 2026
- **Statut**: Production-Ready (avec données en mémoire)
- **Support**: Email à demander

---

**Vous êtes prêt à administrer!** 🎯

Pour toute question: Contactez support@asaa.com (à venir)

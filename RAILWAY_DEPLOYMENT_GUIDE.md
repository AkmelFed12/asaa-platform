# 🚂 Guide Déploiement Railway - ASAA Platform

## **ÉTAPE 1: Allez sur Railway**

Cliquez sur ce lien:
```
https://railway.app
```

---

## **ÉTAPE 2: Connectez-vous ou créez un compte**

- Si vous n'avez pas de compte: Cliquez **"Sign Up"**
- Choisissez: **"Continue with GitHub"**
- Autorisez Railway à accéder à votre GitHub

---

## **ÉTAPE 3: Créez un nouveau projet**

Une fois connecté, vous verrez le dashboard.

Cliquez sur le bouton **"+ New Project"** (en haut à droite)

```
┌──────────────────────────────┐
│  Dashboard                   │
│                              │
│  [+ New Project]  ← CLIQUEZ  │
│                              │
└──────────────────────────────┘
```

---

## **ÉTAPE 4: Sélectionnez "Deploy from GitHub"**

Vous verrez plusieurs options:

```
┌────────────────────────────────────────┐
│  Create a new project                  │
│                                        │
│  ☐ GitHub Repo                         │
│    "Deploy from GitHub"  ← CLIQUEZ     │
│                                        │
│  ☐ Create a Service                    │
│  ☐ Create a Database                   │
│                                        │
└────────────────────────────────────────┘
```

Cliquez sur **"Deploy from GitHub"**

---

## **ÉTAPE 5: Sélectionnez votre repository**

Railway va vous montrer vos repositories GitHub.

Cherchez: **`asaa-platform`**

Cliquez dessus.

```
┌────────────────────────────────────────┐
│  Select a repository                   │
│                                        │
│  🔍 Search: _________________          │
│                                        │
│  ☑ asaa-platform  ← CLIQUEZ ICI       │
│  ☐ other-repo                         │
│                                        │
│  [Deploy]                              │
│                                        │
└────────────────────────────────────────┘
```

---

## **ÉTAPE 6: Railway détecte et déploie**

Railway va automatiquement:

1. ✅ Détecter que c'est un projet Node.js
2. ✅ Installer les dépendances (`npm install`)
3. ✅ Builder l'application
4. ✅ Déployer le backend

**Vous verrez:**
```
Building...      ⏳ (1-2 minutes)
Deploying...     ⏳ (1-2 minutes)
Live!            ✅ (Prêt!)
```

---

## **ÉTAPE 7: Récupérez l'URL Railway**

Une fois le déploiement terminé, vous verrez une URL comme:

```
https://asaa-platform-prod.up.railway.app
```

**C'est votre URL backend!** 📍

### Comment la trouver:

1. Allez dans votre projet Railway
2. Cliquez sur le service (backend)
3. Allez à l'onglet **"Deployments"**
4. Vous verrez l'URL de production

Ou:

1. Cliquez sur le service
2. Allez à **"Settings"**
3. Cherchez **"Domains"**
4. L'URL est affichée là

---

## **ÉTAPE 8: Copiez l'URL**

Une fois que vous avez l'URL Railway:

```
https://asaa-platform-prod.up.railway.app
```

✅ **Copiez-la complètement**

---

## **RÉSUMÉ**

| Étape | Action |
|-------|--------|
| 1 | Allez à railway.app |
| 2 | Connectez avec GitHub |
| 3 | Cliquez "New Project" |
| 4 | Cliquez "Deploy from GitHub" |
| 5 | Sélectionnez "asaa-platform" |
| 6 | Attendez le déploiement (5-10 min) |
| 7 | Récupérez l'URL finale |
| 8 | Copiez l'URL |

---

## **⏱️ TIMING**

```
Connexion:      < 1 min
Déploiement:    5-10 min
TOTAL:          ~10 minutes
```

---

## **✅ Quand c'est prêt**

Vous verrez:

```
✅ Live
https://asaa-platform-prod.up.railway.app
```

**COPIEZ CETTE URL ET DITES-MOI!**

Exemple:
```
"Mon URL Railway est: https://asaa-platform-prod.up.railway.app"
```

---

## **🆘 Si ça ne marche pas**

### Problème: "Build failed"
- Allez dans **"Logs"** pour voir l'erreur
- Vérifiez que le code est correct sur GitHub

### Problème: "Deployment stuck"
- Attendez 10-15 minutes (parfois c'est lent)
- Rechargez la page (F5)

### Problème: "Can't find repository"
- Vérifiez que vous avez autorisé Railway sur GitHub
- Allez à: https://github.com/settings/installations
- Vérifiez que Railway a accès

---

## **PROCHAINES ÉTAPES**

Une fois que vous avez l'URL Railway:

1. ✅ Vous me dites l'URL
2. ✅ Je configure Netlify
3. ✅ Je déploie le frontend
4. ✅ Tout fonctionne! 🎉

---

**ALLEZ-Y! https://railway.app**

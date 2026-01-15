# ✅ Configuration Netlify - ASAA Platform

## **ÉTAPE 1: Allez sur Netlify**

Lien: **https://app.netlify.com**

Connectez-vous avec votre compte GitHub.

---

## **ÉTAPE 2: Créez un nouveau site**

1. Cliquez **"Add new site"** (en haut à gauche)
2. Cliquez **"Import an existing project"**

```
┌─────────────────────────────────┐
│  [+ Add new site ▼]             │
│      └─ Import existing project │
│                                 │
└─────────────────────────────────┘
```

---

## **ÉTAPE 3: Connectez GitHub**

1. Cliquez **"GitHub"**
2. Autorisez Netlify (si demandé)
3. Cherchez votre repository: **`asaa-platform`**
4. Cliquez dessus

```
┌─────────────────────────────────────┐
│  GitHub                             │
│                                     │
│  🔍 Chercher repo: _____________   │
│                                     │
│  ☑ asaa-platform  ← CLIQUEZ       │
│  ☐ other-repo                      │
│                                     │
└─────────────────────────────────────┘
```

---

## **ÉTAPE 4: Configuration du Build**

Netlify va vous montrer des champs:

```
┌──────────────────────────────────────────┐
│  Deploy settings                         │
│                                          │
│  Owner:  [votre-compte]                 │
│  Repo:   [asaa-platform]                │
│  Branch: [main]                         │
│                                          │
│  Build settings:                         │
│  ┌────────────────────────────────────┐ │
│  │ Base directory:  frontend          │ │
│  │ Build command:   npm run build     │ │
│  │ Publish dir:     frontend/build    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [Advanced ▼] ← CLIQUEZ ICI             │
│                                          │
└──────────────────────────────────────────┘
```

**Remplissez exactement:**
- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `frontend/build`

---

## **ÉTAPE 5: Ajouter les variables d'environnement**

1. Cliquez **"Advanced"** (en bas)
2. Cliquez **"New variable"**

```
┌────────────────────────────────────────┐
│  Environment variables                 │
│                                        │
│  [+ New variable]  ← CLIQUEZ ICI      │
│                                        │
└────────────────────────────────────────┘
```

3. Remplissez les champs:

```
┌────────────────────────────────────────┐
│  Add variable                          │
│                                        │
│  Key:                                  │
│  ┌──────────────────────────────────┐ │
│  │ REACT_APP_API_URL                │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Value:                                │
│  ┌──────────────────────────────────┐ │
│  │ https://asaa-platform-production │ │
│  │ .up.railway.app                  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Save]                                │
│                                        │
└────────────────────────────────────────┘
```

**Copiez exactement:**
```
Key:   REACT_APP_API_URL
Value: https://asaa-platform-production.up.railway.app
```

---

## **ÉTAPE 6: Déployer**

1. Cliquez **"Save & deploy"** (en bas)
2. Attendez que Netlify build et déploie (~5-10 minutes)

```
Vous verrez:
Building...      ⏳ (2-3 minutes)
Deploying...     ⏳ (2-3 minutes)
Live!            ✅ (Prêt!)
```

---

## **ÉTAPE 7: Récupérez l'URL Netlify**

Une fois déployé, vous verrez:

```
✅ Site deployed
Your site is live at:
https://asaa-platform.netlify.app
```

**C'est l'URL de votre application!** 🎉

---

## **RÉSUMÉ FINAL**

| Service | URL |
|---------|-----|
| **Frontend (Netlify)** | https://asaa-platform.netlify.app |
| **Backend (Railway)** | https://asaa-platform-production.up.railway.app |
| **Admin** | admin@asaa.com / admin123 |
| **Member** | member@asaa.com / member123 |

---

## **✅ QUAND C'EST PRÊT**

Testez votre application:

1. Allez à: **https://asaa-platform.netlify.app**
2. Connectez-vous avec:
   - Email: `admin@asaa.com`
   - Password: `admin123`
3. Testez les fonctionnalités:
   - ✅ Governance
   - ✅ Quiz
   - ✅ Admin Panel

---

## **🆘 SI ÇA NE MARCHE PAS**

### Erreur: "Cannot connect to API"

**Solution:**
1. Vérifiez l'URL Railway: `https://asaa-platform-production.up.railway.app`
2. Allez dans Netlify → Site settings → Build & deploy → Environment
3. Vérifiez que `REACT_APP_API_URL` est correctement définie
4. Cliquez: Deployments → Trigger deploy → Deploy site

### Erreur: "Build failed"

1. Allez sur Netlify
2. Cliquez: Deployments
3. Cherchez le log rouge
4. Copiez l'erreur
5. Dites-moi l'erreur

---

**ALLEZ-Y! https://app.netlify.com** 🚀

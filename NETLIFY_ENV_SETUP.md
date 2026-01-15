# 🔧 Configuration des Variables d'Environnement - Netlify

## ⚡ GUIDE AUTOMATIQUE - Cliquez exactement où c'est indiqué

---

## **ÉTAPE 1: Connexion à Netlify**

1. Allez à: **https://netlify.com**
2. Connectez-vous avec votre compte
3. Cherchez votre site **`asaa-platform`** dans la liste

---

## **ÉTAPE 2: Accéder aux Paramètres**

### Dans le tableau de bord Netlify:

```
┌─────────────────────────────────────────┐
│  asaa-platform                          │
│  ───────────────────────────────────── │
│                                         │
│  [Production deploys]                  │
│                                         │
│  🔧 Site settings  ← CLIQUEZ ICI      │
│     (en haut à droite)                 │
│                                         │
└─────────────────────────────────────────┘
```

**OU via l'URL directe:**
```
https://app.netlify.com/sites/asaa-platform/settings/general
```

---

## **ÉTAPE 3: Aller à "Build & Deploy"**

### Dans le menu de gauche:
```
📊 Dashboard
🏠 Deploys
📝 Functions
⚙️ Integrations
─────────────────
🔨 Build & deploy  ← CLIQUEZ ICI
   • General
   • Build settings  ← ICI
   • Environment    ← ET ICI
   • Deploy notices
```

---

## **ÉTAPE 4: Ajouter la Variable**

### Dans "Build & deploy" → "Environment":

```
┌─────────────────────────────────────────────────┐
│  🌐 Environment variables                       │
│                                                 │
│  [Edit variables]  ← CLIQUEZ ICI                │
│                                                 │
│  Production                                     │
│  ┌──────────────────────────────────────────┐  │
│  │ Key                  │ Value             │  │
│  ├──────────────────────┼──────────────────┤  │
│  │ (vide)               │ (vide)            │  │
│  └──────────────────────┴──────────────────┘  │
│                                                 │
│  [+ Add variable]  ← CLIQUEZ ICI               │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## **ÉTAPE 5: Remplir les Champs**

### Nouvelle variable à ajouter:

```
┌─────────────────────────────────────────────────┐
│  📝 Add new variable                            │
│                                                 │
│  Key: ┌─────────────────────────────────────┐ │
│       │ REACT_APP_API_URL                   │ │
│       └─────────────────────────────────────┘ │
│                                                 │
│  Value: ┌─────────────────────────────────────┐│
│         │ https://asaa-platform-prod         ││
│         │ .up.railway.app                    ││
│         └─────────────────────────────────────┘│
│                                                 │
│  [Save]  ← CLIQUEZ ICI                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

**⚠️ ATTENTION: Remplacez `asaa-platform-prod` par votre URL Railway réelle!**

---

## **ÉTAPE 6: Redéployer**

### Après avoir sauvegardé:

1. Allez à l'onglet **"Deployments"**
2. Cherchez le dernier déploiement
3. Cliquez sur **"Trigger deploy"** → **"Deploy site"**

```
┌─────────────────────────────────────────┐
│  ⚡ Deployments                         │
│                                         │
│  [Trigger deploy ▼]  ← CLIQUEZ ICI    │
│     └─ Deploy site                      │
│                                         │
│  Fri Jan 15 14:32:45 UTC 2026          │
│  Building...  ⏳                        │
│                                         │
└─────────────────────────────────────────┘
```

---

## **RÉSULTAT FINAL**

Attendez 2-3 minutes, puis:

✅ Votre application est accessible à: **https://asaa-platform.netlify.app**

✅ Elle communique avec votre backend Railway

✅ Les variables d'environnement sont actives

---

## **🔍 VÉRIFIER QUE C'EST BON**

1. Allez sur **https://asaa-platform.netlify.app**
2. Ouvrez la **Console** (F12)
3. Testez les fonctionnalités:
   - ✅ Connexion
   - ✅ Quiz
   - ✅ Governance
   - ✅ Admin Panel

---

## **❌ SI ÇA NE MARCHE PAS**

### Problème: "Cannot connect to API"

**Solution 1:** Vérifiez l'URL Railway
- Allez sur https://railway.app
- Cherchez votre projet
- Copiez l'URL correcte (format: `https://xxx.up.railway.app`)
- Mettez-la à jour dans Netlify

**Solution 2:** Redéployez Netlify
- Allez sur "Deployments"
- Cliquez "Trigger deploy" → "Deploy site"

**Solution 3:** Effacez le cache du navigateur
- Appuyez sur **Ctrl + Shift + Del**
- Sélectionnez "All time"
- Cliquez "Clear data"

---

## **📱 ACCÈS FINAL**

```
┌─────────────────────────────────────────┐
│  🌐 APPLICATION EN LIGNE                │
│                                         │
│  Frontend:                              │
│  https://asaa-platform.netlify.app     │
│                                         │
│  Backend (API):                         │
│  https://[votre-url].up.railway.app    │
│                                         │
│  Admin:     admin@asaa.com / admin123   │
│  Member:    member@asaa.com / member123 │
│                                         │
│  Accessible partout! 🚀                 │
│                                         │
└─────────────────────────────────────────┘
```

---

**📞 Besoin d'aide?**

Si vous êtes bloqué:
1. Dites-moi votre **URL Railway** exacte
2. Dites-moi ce que vous voyez dans la **console** (F12)
3. Je vais configurer tout automatiquement

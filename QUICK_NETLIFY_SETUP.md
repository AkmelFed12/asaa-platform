# ⚡ SETUP NETLIFY RAPIDE - Sans Railway (Mode Test)

## **Option 1: Déployer sans backend (Frontend statique)**

Si vous n'avez pas Railway déployé, vous pouvez tester Netlify avec une URL de test.

### **Étape 1: Allez sur Netlify**
```
https://app.netlify.com/start
```

### **Étape 2: Choisissez "GitHub"**
- Connectez avec votre compte GitHub
- Autorisez Netlify

### **Étape 3: Sélectionnez votre repository**
- Cherchez: **asaa-platform**
- Cliquez dessus

### **Étape 4: Configure le build**

```
✅ Base directory:     frontend
✅ Build command:      npm run build
✅ Publish directory:  frontend/build
```

### **Étape 5: Ajouter les variables d'environnement**

**Option A - URL de test temporaire:**
```
Key:   REACT_APP_API_URL
Value: https://asaa-platform-prod.up.railway.app
```

**Option B - Localhost (pour tester localement):**
```
Key:   REACT_APP_API_URL
Value: http://localhost:5000
```

### **Étape 6: Deploy!**
- Cliquez: **"Deploy site"**
- Attendez 3-5 minutes

---

## **Option 2: Déployer maintenant, connecter Railway plus tard**

1. **Déployez Netlify** avec une URL de test
2. **Déployez Railway** quand vous êtes prêt
3. **Mettez à jour** la variable `REACT_APP_API_URL` dans Netlify
4. **Redéployez** depuis Netlify

---

## **🔄 Mettre à jour la variable après Railway**

Une fois que Railway est déployé:

1. Allez sur Netlify: **https://app.netlify.com/sites/asaa-platform/settings/build**
2. Cliquez: **"Environment"**
3. Modifiez: **`REACT_APP_API_URL`**
4. Mettez votre URL Railway réelle
5. Allez à: **"Deployments"**
6. Cliquez: **"Trigger deploy"** → **"Deploy site"**

---

## **✅ Résumé**

- ✅ Netlify: Prêt en 5 minutes
- ⏳ Railway: À faire quand vous êtes prêt
- 🔄 Mise à jour: Automatique après

**Prêt?** Allez à: https://app.netlify.com/start

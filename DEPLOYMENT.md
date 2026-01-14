# ASAA - Application de Gestion pour Association Islamique

## 🚀 Déploiement Rapide sur Railway (Recommandé)

Railway offre le moyen le plus simple d'accéder à votre application depuis Internet.

### Étapes:

1. **Créer un compte Railway**
   - Allez sur https://railway.app
   - Cliquez sur "Start a Project"
   - Connectez-vous avec GitHub

2. **Déployer votre application**
   - Cliquez sur "Deploy from GitHub"
   - Sélectionnez ce repository (fork vers votre GitHub)
   - Railway déploiera automatiquement

3. **Configurer la base de données**
   - Dans Railway Dashboard
   - Ajoutez PostgreSQL
   - Les variables d'environnement seront configurées automatiquement

4. **Variables d'environnement à ajouter manuellement:**

   **Backend:**
   - `JWT_SECRET=your-secret-key-change-in-production`
   - `NODE_ENV=production`
   - `CORS_ORIGIN=*`

   **Frontend:**
   - `REACT_APP_API_URL=https://votre-backend-railway.railway.app`

5. **Accéder à l'application**
   - URL Frontend: `https://votre-frontend-railway.railway.app`
   - URL Backend API: `https://votre-backend-railway.railway.app`
   - Accédez depuis n'importe où, n'importe quel appareil, n'importe quel réseau

### ✅ Avantages:

- ✅ URL permanente et publique
- ✅ HTTPS automatique (sécurisé)
- ✅ Gratuit pour commencer
- ✅ Base de données PostgreSQL gratuite
- ✅ Déploiement automatique à chaque commit GitHub
- ✅ Accès depuis n'importe où, n'importe quel réseau/téléphone
- ✅ Pas de configuration compliquée

## 🔗 Liens utiles:

- [Railway.app](https://railway.app)
- [Railway Documentation](https://docs.railway.app)
- [Pricing Railway](https://railway.app/pricing)

## Alternative: Docker Compose Local

Pour tester localement avant de déployer:

```bash
docker-compose -f docker-compose.prod.yml up
```

## Note:

Pour utiliser Railway, vous devez d'abord faire un fork de ce repository sur votre compte GitHub, puis le connecter à Railway.

---

**Une fois déployé sur Railway, l'application sera accessible 24/7 depuis n'importe où pour tous vos membres de ASAA!**

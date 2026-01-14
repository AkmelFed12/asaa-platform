#!/bin/bash

# 🚀 Script de déploiement ASAA Platform

echo "===================================="
echo "🌟 ASAA Platform - Déploiement"
echo "===================================="

# Configuration
GITHUB_USERNAME=""
PROJECT_NAME="asaa-platform"

# Demander le nom d'utilisateur GitHub
read -p "📝 Entre ton nom d'utilisateur GitHub: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Erreur: Nom d'utilisateur requis"
    exit 1
fi

# Initialiser Git
echo "🔧 Configuration de Git..."
git config user.name "ASAA Admin"
git config user.email "admin@asaa.com"

# Ajouter les fichiers
echo "📦 Préparation des fichiers..."
git add .
git commit -m "🚀 Initial deployment: ASAA Platform"

# Créer le repository distant
echo "🌐 Création du repository GitHub..."
git branch -M main
git remote add origin "https://github.com/$GITHUB_USERNAME/$PROJECT_NAME.git"

# Instructions finales
echo ""
echo "===================================="
echo "✅ Prêt pour le déploiement!"
echo "===================================="
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1️⃣  Push le code:"
echo "   git push -u origin main"
echo ""
echo "2️⃣  Backend (Railway):"
echo "   - Va sur: https://railway.app"
echo "   - Crée un nouveau projet"
echo "   - Sélectionne le repo GitHub"
echo "   - Copie l'URL du déploiement"
echo ""
echo "3️⃣  Mets à jour frontend/.env:"
echo "   REACT_APP_API_URL=<URL_RAILWAY>"
echo ""
echo "4️⃣  Frontend (Netlify):"
echo "   - Va sur: https://netlify.com"
echo "   - Crée un nouveau site"
echo "   - Sélectionne le repo GitHub"
echo "   - Configure le build:"
echo "     Base: frontend"
echo "     Build: npm run build"
echo "     Publish: frontend/build"
echo ""
echo "🎉 C'est prêt!"
echo "===================================="

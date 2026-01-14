# 🚀 Script de déploiement ASAA Platform (Windows)

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "🌟 ASAA Platform - Déploiement" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Demander le nom d'utilisateur GitHub
$GITHUB_USERNAME = Read-Host "📝 Entre ton nom d'utilisateur GitHub"

if ([string]::IsNullOrEmpty($GITHUB_USERNAME)) {
    Write-Host "❌ Erreur: Nom d'utilisateur requis" -ForegroundColor Red
    exit 1
}

$PROJECT_NAME = "asaa-platform"

# Initialiser Git
Write-Host "🔧 Configuration de Git..." -ForegroundColor Yellow
git config user.name "ASAA Admin"
git config user.email "admin@asaa.com"

# Ajouter les fichiers
Write-Host "📦 Préparation des fichiers..." -ForegroundColor Yellow
git add .
git commit -m "🚀 Initial deployment: ASAA Platform"

# Créer le repository distant
Write-Host "🌐 Création du repository GitHub..." -ForegroundColor Yellow
git branch -M main
git remote add origin "https://github.com/$GITHUB_USERNAME/$PROJECT_NAME.git"

# Instructions finales
Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "✅ Prêt pour le déploiement!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Push le code:" -ForegroundColor Yellow
Write-Host "   git push -u origin main"
Write-Host ""

Write-Host "2️⃣  Backend (Railway):" -ForegroundColor Yellow
Write-Host "   - Va sur: https://railway.app"
Write-Host "   - Crée un nouveau projet"
Write-Host "   - Sélectionne le repo GitHub"
Write-Host "   - Copie l'URL du déploiement"
Write-Host ""

Write-Host "3️⃣  Mets à jour frontend/.env:" -ForegroundColor Yellow
Write-Host "   REACT_APP_API_URL=<URL_RAILWAY>"
Write-Host ""

Write-Host "4️⃣  Frontend (Netlify):" -ForegroundColor Yellow
Write-Host "   - Va sur: https://netlify.com"
Write-Host "   - Crée un nouveau site"
Write-Host "   - Sélectionne le repo GitHub"
Write-Host "   - Configure le build:"
Write-Host "     Base: frontend"
Write-Host "     Build: npm run build"
Write-Host "     Publish: frontend/build"
Write-Host ""

Write-Host "🎉 C'est prêt!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

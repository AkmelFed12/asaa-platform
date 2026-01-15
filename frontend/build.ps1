# Build script for Netlify (PowerShell version)

# Set environment variables if not already set
if (-not $env:REACT_APP_API_URL) {
    $env:REACT_APP_API_URL = "https://asaa-platform-production.up.railway.app"
}

if (-not $env:REACT_APP_ENV) {
    $env:REACT_APP_ENV = "production"
}

if (-not $env:CI) {
    $env:CI = "false"
}

Write-Host "Building ASAA Platform Frontend..."
Write-Host "API URL: $env:REACT_APP_API_URL"
Write-Host "Environment: $env:REACT_APP_ENV"

# Run the build
npm run build

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build completed successfully!"
    exit 0
} else {
    Write-Host "❌ Build failed!"
    exit 1
}

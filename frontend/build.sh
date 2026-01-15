#!/bin/bash

# Build script for Netlify

# Set environment variables if not already set
export REACT_APP_API_URL="${REACT_APP_API_URL:-https://asaa-platform-production.up.railway.app}"
export REACT_APP_ENV="${REACT_APP_ENV:-production}"
export CI="${CI:-false}"

echo "Building ASAA Platform Frontend..."
echo "API URL: $REACT_APP_API_URL"
echo "Environment: $REACT_APP_ENV"

# Run the build
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo "✅ Build completed successfully!"
  exit 0
else
  echo "❌ Build failed!"
  exit 1
fi

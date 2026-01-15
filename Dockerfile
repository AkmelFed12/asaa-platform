# Railway configuration pour déployer le backend ASAA

# Cette app ne contient que le backend Node.js
# Le frontend se déploie sur Netlify

FROM node:18

WORKDIR /app

# Copy package files depuis le dossier backend
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production || npm install --production

# Copy backend source code
COPY backend/src ./src
COPY backend/index.js ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Start the application
CMD ["npm", "start"]

FROM node:18

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production || npm install --production

# Copy app files
COPY backend . 

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start app
CMD ["npm", "start"]

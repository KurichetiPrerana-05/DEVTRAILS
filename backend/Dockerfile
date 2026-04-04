# GigShield Backend (P2) — Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies separately for better layer caching
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy source
COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]

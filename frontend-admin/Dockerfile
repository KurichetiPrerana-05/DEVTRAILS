# Dockerfile — GigShield Admin Dashboard
# Multi-stage: build with Node, serve with nginx

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build-time env vars
ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

ARG VITE_ADMIN_TOKEN=gigshield_admin_secret_dev
ENV VITE_ADMIN_TOKEN=$VITE_ADMIN_TOKEN

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA routing — all paths served by index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

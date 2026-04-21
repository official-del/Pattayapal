# ====================================
# Pattayapal Frontend (React/Vite) - Dockerfile
# ====================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the production bundle (output: /app/dist)
# VITE_API_URL จะถูก inject ตอน build-time ผ่าน --build-arg
ARG VITE_API_URL=https://pattayapal.com
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# --------------------------------

# --- Stage 2: Serve with lightweight Nginx ---
FROM nginx:alpine AS runner

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

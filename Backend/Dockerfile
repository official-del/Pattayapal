# ====================================
# Pattayapal Backend - Dockerfile
# ====================================

# --- Stage 1: Build Dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# --------------------------------

# --- Stage 2: Production Image ---
FROM node:20-alpine AS runner
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy installed dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all backend source code
COPY . .

# Create uploads directory (for local fallback)
RUN mkdir -p uploads

# Do NOT expose secrets here — pass via docker-compose or cloud env vars
# PORT ตั้งไว้ที่ 5000 เพื่อให้ตรงกับ .env
EXPOSE 5000

# Use dumb-init to handle signals correctly (ป้องกัน zombie process)
ENTRYPOINT ["dumb-init", "--"]

# รัน Node.js โดยตรง (ไม่ใช้ nodemon ใน production)
CMD ["node", "server.js"]

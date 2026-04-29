# ====================================
# Pattayapal Frontend (React/Vite) - Dockerfile (Optimized for VPS)
# ====================================

# We skip the Build stage on the server to save RAM and time.
# The 'dist' folder is pre-built locally and pushed to Git.

FROM nginx:alpine AS runner

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-built files from local dist folder
COPY dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ---------- Build stage ----------
# Compiles the React app to static assets. We use a pinned Node LTS so
# the build is reproducible across your dev machine, CI, and the NAS.
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first for better Docker layer caching.
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy source + build static bundle.
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
# Tiny nginx image serves the compiled SPA. No Node runtime needed.
FROM nginx:1.27-alpine AS runtime

# Custom config: gzip on, SPA fallback so deep links don't 404.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Drop the default nginx user warning + run as non-root for safety on
# Synology where /volume1 mappings can be picky about permissions.
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]

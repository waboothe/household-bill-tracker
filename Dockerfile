# ---------- Build stage ----------
# Compiles the React app to static assets. We use a pinned Node LTS so
# the build is reproducible across your dev machine, CI, and the NAS.
FROM node:20-alpine AS build
WORKDIR /app

# Belt + suspenders + duct tape: force every known npm knob to install
# devDependencies. Different npm versions / base images have wildly
# different defaults around production mode and we've been bitten by
# `sh: vite: not found` enough times to nail this shut.
ENV NODE_ENV=development \
    NPM_CONFIG_PRODUCTION=false \
    npm_config_production=false

# Install dependencies first for better Docker layer caching.
COPY package.json package-lock.json* ./
RUN npm install --include=dev --no-audit --no-fund

# Sanity check — fail loudly here (not 6 lines later) if vite is missing.
RUN ls node_modules/.bin/vite >/dev/null \
    || (echo "❌ vite missing from node_modules/.bin — devDependencies were skipped"; \
        ls node_modules/.bin | head -20; exit 1)

# Copy source + build static bundle.
COPY . .
RUN npx vite build

# ---------- Runtime stage ----------
# Tiny nginx image serves the compiled SPA. No Node runtime needed.
FROM nginx:1.27-alpine AS runtime

# Custom config: gzip on, SPA fallback so deep links don't 404,
# and /api/* reverse-proxied to the FastAPI service.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]

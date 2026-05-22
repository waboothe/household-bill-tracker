# ---------- Build stage ----------
# Compiles the React app to static assets. We use a pinned Node LTS so
# the build is reproducible across your dev machine, CI, and the NAS.
FROM node:20-alpine AS build
WORKDIR /app

ENV NODE_ENV=development \
    NPM_CONFIG_PRODUCTION=false \
    npm_config_production=false

COPY package.json package-lock.json* ./

# Verbose debug install — print versions, the resolved env, and a full
# inventory after. If we still don't get vite, the output will pinpoint
# exactly which knob is overriding us.
RUN echo "=== node $(node -v) / npm $(npm -v) ===" \
 && echo "=== env (npm-related) ===" \
 && env | grep -iE 'npm|node_env' || true \
 && echo "=== npm config (key bits) ===" \
 && npm config get production \
 && npm config get include \
 && npm config get omit \
 && echo "=== package.json devDependencies ===" \
 && node -e "console.log(Object.keys(require('./package.json').devDependencies||{}))" \
 && echo "=== running npm install ===" \
 && npm install --include=dev --no-audit --no-fund --loglevel=http 2>&1 | tail -40 \
 && echo "=== node_modules summary ===" \
 && (ls node_modules | wc -l && echo "packages installed") \
 && echo "=== .bin contents ===" \
 && ls node_modules/.bin 2>&1 | head -40 \
 && echo "=== vite presence check ===" \
 && (ls node_modules/.bin/vite && echo "✅ vite found") \
     || (echo "❌ vite MISSING — see above"; exit 1)

COPY . .
RUN npx vite build

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]

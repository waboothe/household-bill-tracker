# Single-stage nginx serving the pre-built React bundle from ./dist.
#
# The frontend bundle is built locally (`npm run build`) and committed
# to the repo, so the NAS never has to install Node or run npm. This
# dodges every "vite: not found" / devDependencies / lockfile drift trap.
# To update the bundle: build locally → commit `dist/` → rebuild the image.
FROM nginx:1.27-alpine

# SPA fallback, gzip, and /api/* proxy to the FastAPI service.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]

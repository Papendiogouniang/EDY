# ── Stage 1: Dependencies ─────────────────────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: Production ───────────────────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S dunis -u 1001
USER dunis

COPY --from=deps --chown=dunis:nodejs /app/node_modules ./node_modules
COPY --chown=dunis:nodejs . .

EXPOSE 5000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]

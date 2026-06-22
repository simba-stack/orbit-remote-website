# ---- Orbit Remote website ----
FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy application source.
COPY . .

# Railway provides PORT at runtime; default to 3000 locally.
ENV PORT=3000
EXPOSE 3000

# Basic container healthcheck hitting the JSON health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1 || exit 1

CMD ["node", "src/server.js"]

# ── Stage 1: Install dependencies ────────────────────────────
FROM node:18 AS builder

WORKDIR /app

# Copy package files and install production dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# ── Stage 2: Runtime image ────────────────────────────────────
FROM node:18-alpine AS runtime

WORKDIR /app

# Copy installed node_modules from builder
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Copy backend source
COPY backend/ ./backend/

# Copy frontend static files
COPY frontend/ ./frontend/

# Copy database init scripts (for reference / Railway init plugin)
COPY init-db/ ./init-db/

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "backend/server.js"]

# ==========================
# Stage 1: Builder
# ==========================
# Install ALL dependencies (including devDependencies)
# This stage is used for building/testing purposes
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files first for better layer caching
COPY package*.json ./

# Use npm ci when a lockfile exists, otherwise fall back to npm install
# BuildKit cache mount persists cache between builds
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy application source code
COPY . .

# ==========================
# Stage 2: Runtime
# ==========================
# Minimal runtime image - production dependencies only
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user for security
# uid:gid 1001 is commonly used in containers
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001

# Copy ONLY production dependencies from builder
# --omit=dev excludes devDependencies (~40-50% size reduction)
# BuildKit cache mount for faster subsequent builds
COPY --from=builder --chown=appuser:appuser /build/node_modules ./node_modules

# Copy application code with proper ownership
COPY --chown=appuser:appuser . .

# Remove development-only dependencies from the runtime tree.
RUN npm prune --omit=dev

# Switch to non-root user
USER appuser

# Expose port 3000
EXPOSE 3000

# Health check endpoint
# Interval: 30s, Timeout: 10s, Start period: 5s, Retries: 3
# Checks if /health endpoint returns 200 status
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start application using npm start (runs node server.js)
CMD ["npm", "start"]
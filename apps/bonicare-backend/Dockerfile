# ==========================
# Stage 1: Builder
# ==========================
FROM node:20-alpine AS builder

WORKDIR /build

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .


# ==========================
# Stage 2: Runtime
# ==========================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001

# Copy dependencies
COPY --from=builder --chown=appuser:appuser /build/node_modules ./node_modules

# Copy application
COPY --chown=appuser:appuser . .

# Remove development-only dependencies from the runtime tree.
RUN npm prune --omit=dev

# Switch to non-root user
# Create writable uploads directory
RUN mkdir -p /app/uploads && \
    chown -R appuser:appuser /app/uploads

# Run as non-root
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

CMD ["npm", "start"]
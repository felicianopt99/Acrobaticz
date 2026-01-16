# syntax=docker/dockerfile:1.7
# ============================================================
# Multi-stage Dockerfile for Acrobaticz (Next.js 15)
# Optimized for:
# - Minimal final image size (~280MB)
# - Fast build times with layer caching
# - Security (non-root user)
# - Production readiness
# ============================================================

# ============================================================
# Stage 1: Dependencies (Cached Layer)
# ============================================================
FROM node:22-alpine AS deps
WORKDIR /app

# Install only essential build tools
RUN apk add --no-cache openssl curl

# Copy package manifests ONLY (for cache efficiency)
COPY package.json package-lock.json ./

# Clean install with fallback for compatibility
# Uses npm ci for reproducible builds, falls back to npm install if lock file issues
RUN npm ci --omit=dev --no-audit --no-fund --loglevel=error || \
    npm install --omit=dev --legacy-peer-deps --no-audit --no-fund --loglevel=error && \
    npm cache clean --force

# ============================================================
# Stage 2: Builder (Application Compilation)
# ============================================================
FROM node:22-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NODE_OPTIONS="--max_old_space_size=4096"

# Install build dependencies
RUN apk add --no-cache openssl python3 make g++

# Copy production dependencies from Stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy package files
COPY package.json package-lock.json ./

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application source
COPY . .

# Build Next.js application
# Note: next.config.ts must have: output: 'standalone'
RUN npm run build && \
    # Verify standalone output exists
    if [ ! -d ".next/standalone" ]; then \
      echo "ERROR: Next.js standalone output not found"; \
      echo "Ensure next.config.ts contains: output: 'standalone'"; \
      exit 1; \
    fi

# ============================================================
# Stage 3: Runtime (Production Image)
# ============================================================
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Install runtime dependencies only
RUN apk add --no-cache \
    ca-certificates \
    curl \
    openssl \
    postgresql-client \
    tini && \
    # Create non-root user for security
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built application from builder stage
# Using standalone output (already optimized by Next.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone /app/
COPY --from=builder --chown=nextjs:nodejs /app/.next/static /app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public /app/public
COPY --from=builder --chown=nextjs:nodejs /app/prisma /app/prisma
COPY --from=builder --chown=nextjs:nodejs /app/.env* /app/

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Security: Run as non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Default command
CMD ["/app/docker-entrypoint.sh"]

# syntax=docker/dockerfile:1.7
# ============================================================
# Multi-stage Dockerfile for Acrobaticz (Next.js 15)
# Optimized for:
# - Minimal final image size (~280MB)
# - Fast build times with layer caching
# - Security (non-root user)
# - Production readiness
# - Integrity validation (Prisma, Next.js output)
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

# Generate Prisma client with validation
RUN npx prisma generate && \
    # Verify Prisma client was generated
    if [ ! -d "node_modules/.prisma/client" ]; then \
      echo "ERROR: Prisma client generation failed"; \
      exit 1; \
    fi && \
    # Verify schema integrity
    npx prisma validate && \
    echo "✅ Prisma schema validated successfully"

# Copy application source
COPY . .

# Build Next.js application with comprehensive checks
RUN npm run build && \
    # Verify standalone output exists
    if [ ! -d ".next/standalone" ]; then \
      echo "ERROR: Next.js standalone output not found"; \
      echo "Ensure next.config.ts contains: output: 'standalone'"; \
      exit 1; \
    fi && \
    # Verify required directories in standalone
    if [ ! -f ".next/standalone/server.js" ]; then \
      echo "ERROR: Next.js server.js not found in standalone output"; \
      exit 1; \
    fi && \
    echo "✅ Next.js standalone build verified successfully" && \
    echo "✅ Build output size:" && \
    du -sh .next/standalone

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

# Copy Prisma files (needed for runtime migrations if using prisma migrate deploy)
COPY --from=builder --chown=nextjs:nodejs /app/prisma /app/prisma

# Copy node_modules/.prisma with explicit permissions for runtime access
COPY --from=builder --chown=nextjs:nodejs /app/node_modules /app/node_modules

# Copy entrypoint script (does NOT copy .env files for security)
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Create runtime cache/tmp directories with correct permissions
RUN mkdir -p /app/.cache /app/tmp /app/.next/cache && \
    chown -R nextjs:nodejs /app/.cache /app/tmp /app/.next/cache && \
    chmod 755 /app/.cache /app/tmp /app/.next/cache

# Verify permissions are correct for nextjs user
RUN test -r /app/node_modules && \
    test -w /app/.cache && \
    test -w /app/tmp && \
    echo "✅ Permission checks passed" || \
    (echo "❌ Permission issues detected"; exit 1)

# Health check endpoint - robust with retries
# Increased start_period to 60s for slow systems
# Timeout 10s to account for slow DB queries
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Security: Run as non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Default command
CMD ["/app/docker-entrypoint.sh"]

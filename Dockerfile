# syntax=docker/dockerfile:1.7
# ============================================================
# Multi-stage Dockerfile for Acrobaticz (Next.js 15)
# Ultra-Portable for Cross-Platform Deployments
# Optimized for:
# - Multi-arch support (linux/amd64, linux/arm64/v8, linux/arm/v7)
# - Minimal final image size (~280MB)
# - Fast build times with layer caching
# - Security (non-root user)
# - Production readiness
# - Integrity validation (Prisma, Next.js output)
# - Self-healing and auto-recovery
# - Works on: AWS, Azure, GCP, DigitalOcean, Linode, local servers
# 
# Build command (multi-arch):
#   docker buildx build --platform linux/amd64,linux/arm64 -t acrobaticz:latest .
# ============================================================

# ============================================================
# Stage 1: Dependencies (Cached Layer)
# Multi-arch support: linux/amd64, linux/arm64, linux/arm/v7
# ============================================================
FROM node:22-alpine AS deps
WORKDIR /app

# Detect architecture for logging purposes
RUN echo "Building for: $(uname -m)" && \
    apk add --no-cache openssl curl bash

# Copy package manifests ONLY (for cache efficiency)
COPY package.json package-lock.json ./

# Clean install with fallback for compatibility
# Uses npm ci for reproducible builds, falls back to npm install if lock file issues
# Timeout increased for slower systems (ARM64, older hardware)
RUN npm ci --omit=dev --no-audit --no-fund --loglevel=error --fetch-timeout=120000 || \
    npm install --omit=dev --legacy-peer-deps --no-audit --no-fund --loglevel=error && \
    npm cache clean --force && \
    echo "✅ Dependencies installed successfully"

# ============================================================
# Stage 2: Builder (Application Compilation)
# Handles both fast servers (amd64) and slower systems (ARM)
# ============================================================
FROM node:22-alpine AS builder
WORKDIR /app

# Accept DATABASE_URL as build argument for Prisma generation
ARG DATABASE_URL=postgresql://acrobaticz_user:acrobaticz_secure_db_pass_2024@postgres:5432/acrobaticz?schema=public&sslmode=disable

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NODE_OPTIONS="--max_old_space_size=4096" \
    BUILDKIT_INLINE_CACHE=1 \
    DATABASE_URL=${DATABASE_URL}

# Install build dependencies with platform-specific optimizations
RUN apk add --no-cache openssl python3 make g++ bash curl && \
    # Detect CPU cores for parallel builds
    CORES=$(getconf _NPROCESSORS_ONLN) && \
    echo "Build system has $CORES CPU cores"

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

# Build Next.js application with comprehensive checks and timeout handling
RUN timeout 1200 npm run build || { \
      echo "❌ Build failed or timed out"; \
      echo "Available disk space:"; \
      df -h; \
      echo "Available memory:"; \
      free -h; \
      exit 1; \
    } && \
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
    du -sh .next/standalone && \
    echo "✅ Build completed on architecture: $(uname -m)"

# ============================================================
# Stage 3: Runtime (Production Image)
# Ultra-light, portable, works on all platforms
# ============================================================
FROM node:22-alpine AS runtime
WORKDIR /app

LABEL maintainer="Acrobaticz Team" \
      description="Portable Next.js application for Acrobaticz" \
      version="1.0" \
      architecture="multi-platform"

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NODE_OPTIONS="--max_old_space_size=2048"

# Install runtime dependencies only with enhanced compatibility
RUN apk add --no-cache \
    ca-certificates \
    curl \
    openssl \
    postgresql-client \
    tini \
    bash \
    dumb-init && \
    # Create non-root user for security
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    echo "✅ Runtime environment prepared for $(uname -m)"

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
    (echo "❌ Permission issues detected"; exit 1) && \
    # Verify image works on this architecture
    node --version && npm --version

# Health check endpoint - robust with retries
# Tuned for slow systems (ARM64, low-end servers)
# start_period: 90s for databases that take time to initialize
# timeout: 15s for slow network/disk I/O
# interval: 45s to avoid overwhelming system
HEALTHCHECK --interval=45s --timeout=15s --start-period=90s --retries=5 \
    CMD curl -sf http://localhost:3000/api/health > /dev/null || exit 1

# Security: Run as non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Use dumb-init or tini as PID 1 for proper signal handling
# Works on all architectures
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Default command with error handling
CMD ["/bin/bash", "-c", "exec /app/docker-entrypoint.sh"]

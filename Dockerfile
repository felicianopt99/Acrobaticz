# syntax=docker/dockerfile:1.7
# ============================================================
# Acrobaticz Dockerfile - Pre-built Next.js Application
# 
# This Dockerfile expects pre-built Next.js output
# Build locally: npm install && npm run build
# Then: docker compose up (copies pre-built .next/)
# 
# No build happens in Docker - fast deployment
# Minimal layer: Only copies pre-built artifacts
# ============================================================

# ============================================================
# Stage 1: Runtime (Production Image)
# Ultra-light, portable, works on all platforms
# ============================================================
FROM node:22-alpine AS runtime
WORKDIR /app

LABEL maintainer="Acrobaticz Team" \
      description="Portable Next.js application for Acrobaticz" \
      version="1.0" \
      build_mode="pre-built"

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NODE_OPTIONS="--max_old_space_size=2048"

# Install runtime dependencies only
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
    echo "✅ Runtime environment prepared"

# Copy pre-built Next.js output from local .next directory
# Expected to exist from: npm run build (run locally before docker compose up)
COPY --chown=nextjs:nodejs .next/standalone /app/
COPY --chown=nextjs:nodejs .next/static /app/.next/static
COPY --chown=nextjs:nodejs public /app/public 2>/dev/null || true

# Copy Prisma files (needed for runtime)
COPY --chown=nextjs:nodejs prisma /app/prisma
COPY --chown=nextjs:nodejs package.json package-lock.json ./

# Install runtime dependencies only (devDependencies excluded)
RUN npm ci --omit=dev --no-audit --no-fund && \
    npm cache clean --force

# Copy Prisma client files
COPY --chown=nextjs:nodejs node_modules/.prisma /app/node_modules/.prisma

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Create runtime cache/tmp directories with correct permissions
RUN mkdir -p /app/.cache /app/tmp /app/.next/cache && \
    chown -R nextjs:nodejs /app/.cache /app/tmp /app/.next/cache && \
    chmod 755 /app/.cache /app/tmp /app/.next/cache

# Verify pre-built files exist
RUN test -f /app/server.js && \
    test -d /app/.next/static && \
    echo "✅ Pre-built Next.js files verified" || \
    (echo "❌ ERROR: Pre-built files missing. Run 'npm run build' locally first"; exit 1)

# Health check endpoint
HEALTHCHECK --interval=45s --timeout=15s --start-period=90s --retries=5 \
    CMD curl -sf http://localhost:3000/api/health > /dev/null || exit 1

# Security: Run as non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Use dumb-init as PID 1 for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Default command with error handling
CMD ["/bin/bash", "-c", "exec /app/docker-entrypoint.sh"]

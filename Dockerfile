# syntax=docker/dockerfile:1.6
# Multi-stage Dockerfile for Next.js 16 standalone build with Prisma
# OPTIMIZED: 3-stage build, parallel builds, minimal final image

# ============================================
# Stage 1: Dependencies - Cached separately
# ============================================
FROM node:22-alpine AS deps
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache openssl

# Copy only package files for dependency caching
COPY package.json package-lock.json ./

# Install dependencies (npm cache on volume if using compose)
RUN npm ci --legacy-peer-deps --no-audit --no-fund --loglevel=error

# ============================================
# Stage 2: Builder - Compile application
# ============================================
FROM node:22-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max_old_space_size=4096"

# Install build tools
RUN apk add --no-cache openssl

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Copy prisma first for better caching
COPY prisma ./prisma

# Generate Prisma client (cached if schema unchanged)
RUN npx prisma generate

# Copy source files
COPY . .

# Build Next.js
RUN npm run build && \
    mkdir -p .next/server && \
    if [ ! -f .next/server/middleware.js.nft.json ]; then \
      echo '{"files":[],"version":1}' > .next/server/middleware.js.nft.json; \
    fi

# ============================================
# Stage 3: Production Runtime - Minimal image
# ============================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Install minimal runtime dependencies
RUN apk add --no-cache ca-certificates openssl postgresql-client tini && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build (already includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy necessary runtime node_modules for custom server
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy custom server and scripts
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Fix permissions
RUN chmod +x ./scripts/deployment/docker-entrypoint.sh 2>/dev/null || true

USER nextjs

EXPOSE 3000

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["sh", "./scripts/deployment/docker-entrypoint.sh"]

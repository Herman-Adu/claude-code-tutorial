# =============================================================================
# Dockerfile for Kanban Board Application
# Multi-stage build for optimal image size and security
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# Install all dependencies (including dev dependencies for build)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Install dependencies required for native modules and Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build stage)
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Builder
# Build the Next.js application
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Install openssl for Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and configuration files
COPY . .

# Copy Prisma schema and generate Prisma Client
# This must happen before the build as Next.js needs the generated client
COPY prisma ./prisma
RUN npx prisma generate

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
# Note: DATABASE_URL is not needed at build time for Next.js static analysis
RUN npm run build

# Validate standalone build was created successfully
RUN test -d /app/.next/standalone || (echo "ERROR: Next.js standalone build failed" && exit 1)

# -----------------------------------------------------------------------------
# Stage 3: Runner (Production)
# Minimal image for running the application
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install openssl for Prisma runtime and curl for health checks
RUN apk add --no-cache libc6-compat openssl curl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
# Using node user that comes with the official Node.js image
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder stage
# Copy public assets
COPY --from=builder /app/public ./public

# Copy built application
# Next.js outputs to .next directory
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client for runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Copy node_modules for Prisma runtime (only essential packages)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Switch to non-root user
USER nextjs

# Expose the application port
EXPOSE 3000

# Set hostname for Next.js
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Health check using curl (wget not available in Alpine runner)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl --fail --silent http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]

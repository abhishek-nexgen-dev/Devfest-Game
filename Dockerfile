# ==========================================
# Stage 1: Build Stage
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install native compilation dependencies for C++ addons (argon2, etc.)
RUN apk add --no-cache libc6-compat python3 make g++

# Enable modern package management
RUN npm install -g pnpm

# Cache package manifests and install dependencies
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code and build TypeScript to dist/
COPY . .
RUN pnpm build

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime C libraries and process supervisor for signal handling
RUN apk add --no-cache libc6-compat dumb-init
RUN npm install -g pnpm

# Standard Node Production Environment
ENV NODE_ENV=production
ENV PORT=3000

# Force IPv4 resolution order globally to prevent ENETUNREACH in IPv4-only cloud hosts (Render/AWS)
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

# Install production dependencies only
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

# Copy compiled JavaScript output and dist package.json from builder
COPY --from=builder /app/dist ./dist

# Ensure non-root node user owns application files
RUN chown -R node:node /app

# Create and use non-root application user for container security
USER node

# Expose default port (Render will override PORT dynamically at runtime)
EXPOSE 3000

# Container Healthcheck (matches GET /health endpoint)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/health || exit 1

# Launch application via dumb-init for graceful shutdown signals
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]

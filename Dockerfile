# Multi-stage Dockerfile for HELPDESK Monorepo deployment on Railway
FROM oven/bun:1 AS base
WORKDIR /app

# Step 1: Install dependencies and build client
FROM base AS client-builder
WORKDIR /app/client
COPY client/package.json client/bun.lock* ./
RUN bun install --frozen-lockfile || bun install
COPY client/ ./
COPY core/ ../core/
RUN bun run build

# Step 2: Install server dependencies and generate Prisma client
FROM base AS server-builder
WORKDIR /app/server
COPY server/package.json server/bun.lock* ./
RUN bun install --frozen-lockfile || bun install
COPY server/ ./
COPY core/ ../core/
RUN bunx prisma generate

# Step 3: Production runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built assets and server code
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=server-builder /app/server ./server
COPY package.json ./

WORKDIR /app/server

EXPOSE 3000

# Push DB migrations if needed and start Express server
CMD ["sh", "-c", "bunx prisma db push && bun start"]

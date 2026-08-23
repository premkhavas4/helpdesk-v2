# Dockerfile for HELPDESK Monorepo deployment
FROM oven/bun:1
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy project files
COPY . .

# Generate Prisma Client
WORKDIR /app/server
RUN bunx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "bunx prisma db push && bun start"]




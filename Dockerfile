# Dockerfile for HELPDESK Monorepo deployment
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy project files
COPY . .

# Install dependencies and build client + server
RUN npm install --include=dev
RUN npm run build

# Expose port
EXPOSE 3000

# Start backend server
CMD ["npx", "tsx", "server/src/index.ts"]

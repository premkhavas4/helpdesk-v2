# Dockerfile for HELPDESK Monorepo deployment
FROM node:20-alpine
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies for root, client, and server
RUN npm install
RUN npm --prefix client install
RUN npm --prefix server install

# Build client and server
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Start Express server immediately on container launch
CMD ["npx", "tsx", "server/src/index.ts"]

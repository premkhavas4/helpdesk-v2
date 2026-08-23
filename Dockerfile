# Dockerfile for HELPDESK Monorepo deployment
FROM node:20-alpine
WORKDIR /app

# Copy project files
COPY . .

# Install root, client, and server dependencies
RUN npm install
RUN npm --prefix client install
RUN npm --prefix server install

# Build client and server
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Start backend server
CMD ["npx", "tsx", "server/src/index.ts"]

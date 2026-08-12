# Tech Stack

## Backend
- **Node.js + Express** — lightweight, event-driven, rich ecosystem for email/AI integrations
- **PostgreSQL** — relational data (tickets, users, statuses); can add vector extensions later for semantic search

## Frontend
- **React** — standard choice for dashboards and ticket management UI
- **TypeScript** — type safety for better maintainability

## Database 
-PostgreSQL

## AI/LLM
- **Claude API** (Anthropic) — best-in-class for text understanding and generation; used for ticket classification and reply generation

## Email Integration
- **Nodemailer** — send responses back to customers
- **Polling service** (custom or Bull job queue) — periodically fetch emails via IMAP or use webhooks

## Authentication
- **Database sessions** — store session tokens in PostgreSQL, no external auth service required
- **Secure cookies** — httpOnly, sameSite flags for session management

## Knowledge Base
- Store in PostgreSQL as documents with embeddings
- Retrieve relevant docs via semantic search when generating responses

## Deployment
- **Docker + Docker Compose** (local/simple) or **Railway/Render** (managed, minimal ops)
- PostgreSQL hosted or self-hosted

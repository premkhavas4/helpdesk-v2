# AI-Powered Helpdesk System

A full-stack ticket management system that uses AI to automatically classify, respond to, and support tickets.

## Tech Stack

- **Server:** Node.js + Express + TypeScript
- **Client:** React + TypeScript + Vite
- **Runtime:** Bun
- **Database:** PostgreSQL (with Prisma ORM)
- **AI:** Claude API (Anthropic)
- **Email:** Nodemailer + SMTP

## Project Structure

```
HELPDESK/
├── server/                # Express server
│   ├── src/
│   │   ├── index.ts       # Entry point
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Auth, validation, etc.
│   │   ├── services/      # Business logic
│   │   ├── models/        # Prisma models
│   │   ├── config/        # Configuration
│   │   └── utils/         # Helper functions
│   ├── .env               # Environment variables
│   └── package.json
│
├── client/                # React client
│   ├── src/
│   │   ├── App.tsx        # Main app component
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   └── utils/         # Helper functions
│   ├── .env               # Environment variables
│   └── package.json
│
└── implementation-plan.md # Development roadmap
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed (v1.3+)
- PostgreSQL installed and running
- Node.js 18+ (for compatibility)

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd HELPDESK
   ```

2. **Setup Server:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env and add your database URL and API keys
   bun install
   bun run dev
   ```

3. **Setup Client:**
   ```bash
   cd client
   cp .env.example .env
   # Edit .env if needed
   bun install
   bun run dev
   ```

4. **Access the application:**
   - Client: http://localhost:5173
   - Server API: http://localhost:3000

## Development

### Server Commands

```bash
bun run dev      # Start development server with hot reload
bun run start    # Start production server
bun run build    # Build for production
```

### Client Commands

```bash
bun run dev      # Start Vite dev server
bun run build    # Build for production
bun run preview  # Preview production build
```

## Environment Variables

### Server (.env)

```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DATABASE_URL=postgresql://user:password@localhost:5432/helpdesk
SESSION_SECRET=your-secret-key

ANTHROPIC_API_KEY=your-claude-api-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=support@helpdesk.com
```

### Client (.env)

```env
VITE_API_URL=http://localhost:3000
```

## Features (Planned)

### Phase 1: Project Setup ✅
- Backend with Express + TypeScript → Server
- Frontend with React + Vite → Client
- Database setup with Prisma
- Development environment

### Phase 2: Authentication
- Login/logout
- Session management
- Protected routes

### Phase 3: User Management
- Role-based access (Admin/Agent)
- User CRUD operations

### Phase 4: Ticket CRUD
- Create, read, update tickets
- Ticket list with filtering
- Ticket detail page

### Phase 5: AI Features
- Automatic ticket classification
- AI-suggested replies
- Knowledge base integration

### Phase 6: Email Integration
- Inbound email webhook
- Outbound email sending
- Email threading

### Phase 7: Dashboard
- Stats overview
- Category breakdown
- Quick filters

### Phase 8: Polish & Deployment
- Error handling
- Docker setup
- Production deployment

## Contributing

This is a learning project. Feel free to explore and modify as needed.

## License

MIT

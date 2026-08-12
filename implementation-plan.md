# AI-Powered Ticket Management System - Implementation Plan

## Project Overview
Build a ticket management system that automatically processes support emails, classifies tickets using AI, and generates intelligent responses using Claude API and a knowledge base.

---

## Phase 1: Project Setup

### Goals
Set up the foundational structure for the application, including backend, frontend, database, and development environment.

### Tasks
- Create backend folder with Node.js/Express setup
- Create frontend folder with React/TypeScript setup
- Initialize package.json for both projects
- Setup TypeScript configurations
- Install PostgreSQL locally or setup hosted instance
- Setup Prisma ORM and define Prisma schema
- Run Prisma migrations to create database tables
- Create admin seed data for initial login
- Create .gitignore and environment variable templates
- Setup ESLint and Prettier
- Document local development setup in README

### Deliverables
- Working backend and frontend scaffolding
- Database configured with Prisma
- Admin user seeded in database
- Development environment ready

---

## Phase 2: Authentication

### Goals
Implement secure authentication system with login, sessions, and route protection.

### Tasks
- Implement password hashing (bcrypt)
- Create POST /auth/register endpoint (admin only)
- Create POST /auth/login endpoint
- Create POST /auth/logout endpoint
- Create GET /auth/me endpoint (current user info)
- Create sessions table and implement session management
- Implement session middleware for protected routes
- Store session token securely in httpOnly cookies
- Create login page component in React
- Setup auth context/provider in React
- Implement protected route wrapper
- Handle authentication errors and redirects

### Deliverables
- Secure login/logout functionality
- Session-based authentication
- Protected routes on frontend and backend
- Auth context available throughout React app

---

## Phase 3: User Management

### Goals
Implement role-based access control and admin functionality to create and manage agents.

### Tasks
- Define user roles in Prisma schema (Admin, Agent)
- Implement role-based middleware for API endpoints
- Create GET /users endpoint (admin only)
- Create POST /users endpoint (admin creates agents)
- Create PUT /users/:id endpoint (admin updates users)
- Create DELETE /users/:id endpoint (admin deletes users)
- Create user list page (admin only)
- Create user creation form component
- Display user roles (Admin/Agent) in UI
- Implement user edit and delete functionality in UI
- Add role-based UI rendering (show/hide features based on role)

### Deliverables
- Role-based access control system
- Admin can create, view, edit, and delete agent users
- UI respects user roles and permissions

---

## Phase 4: Ticket CRUD

### Goals
Build core ticket management functionality with list, detail, filtering, and CRUD operations.

### Tasks
- Define tickets table in Prisma schema (id, subject, body, sender_email, status, category, assigned_to, created_at, updated_at)
- Define ticket_responses table in Prisma schema
- Run Prisma migrations
- Create POST /tickets endpoint (manual ticket creation)
- Create GET /tickets endpoint (list with filtering, sorting, pagination)
- Create GET /tickets/:id endpoint (single ticket detail)
- Create PATCH /tickets/:id endpoint (update status, category, assignment)
- Create POST /tickets/:id/responses endpoint (add response to ticket)
- Implement query filters (status, category, date range, search)
- Create ticket list page component
- Display tickets in table/card format
- Add filters (status, category, search bar)
- Add sorting options (date, status, category)
- Implement pagination controls
- Create ticket detail page component
- Display ticket metadata (sender, date, status, category)
- Show conversation thread (original email + responses)
- Add status update dropdown
- Add category update dropdown
- Add form to submit responses

### Deliverables
- Full CRUD operations for tickets
- Ticket list page with filtering, sorting, and pagination
- Ticket detail page with conversation view
- Ability to update ticket status and category
- Ability to add responses to tickets

---

## Phase 5: AI Features

### Goals
Integrate Claude API for ticket classification, summaries, suggested replies, and knowledge base retrieval.

### Tasks
- Install Anthropic SDK (@anthropic-ai/sdk)
- Configure Claude API key in environment variables
- Create Claude service wrapper with error handling
- Create classification prompt template
- Implement POST /tickets/:id/classify endpoint
- Parse Claude response and extract category
- Update ticket category in database
- Create POST /tickets/:id/summarize endpoint
- Generate ticket summary using Claude API
- Create POST /tickets/:id/generate-response endpoint
- Build prompt with ticket context
- Retrieve relevant knowledge base documents (if available)
- Call Claude API to generate suggested reply
- Return generated response to frontend
- Define knowledge_base table in Prisma schema (id, title, content, category, created_at, updated_at)
- Create POST /knowledge-base endpoint (add document)
- Create GET /knowledge-base endpoint (list documents)
- Create PUT /knowledge-base/:id endpoint (update document)
- Create DELETE /knowledge-base/:id endpoint (delete document)
- Create knowledge base management page (admin only)
- Add "Classify Ticket" button in ticket detail UI
- Display AI-generated summary in ticket detail
- Add "Generate AI Response" button in ticket detail
- Display suggested reply in editable text area
- Allow agents to edit AI-generated responses before sending

### Deliverables
- Claude API integrated and working
- Automatic ticket classification
- Ticket summary generation
- AI-suggested replies with editing capability
- Knowledge base CRUD functionality
- Knowledge base management UI

---

## Phase 6: Email Integration

### Goals
Enable inbound email webhook to create tickets and outbound email sending for replies with email threading.

### Tasks
- Setup email service provider with webhook support (SendGrid, Mailgun, etc.)
- Create POST /webhooks/email endpoint to receive inbound emails
- Parse incoming email (subject, body, sender, thread_id)
- Create ticket from inbound email automatically
- Handle email threading (link replies to existing tickets)
- Extract email thread_id/references for threading
- Configure Nodemailer with SMTP credentials
- Create email sending service
- Format responses as professional emails
- Create POST /tickets/:id/send-email endpoint
- Send email when agent submits response
- Include proper email headers for threading (In-Reply-To, References)
- Log sent emails in ticket_responses table
- Mark emails as sent_via_email in database
- Handle email sending errors gracefully

### Deliverables
- Inbound email webhook creates tickets automatically
- Outbound email sending via Nodemailer
- Email threading preserves conversation context
- Error handling for email failures

---

## Phase 7: Dashboard

### Goals
Create a dashboard with overview stats, category breakdown, and quick filters.

### Tasks
- Create GET /dashboard/stats endpoint
- Calculate total tickets count
- Calculate open tickets count
- Calculate resolved tickets count
- Calculate closed tickets count
- Calculate tickets by category breakdown
- Calculate average response time (optional)
- Get recent activity (last 10-20 tickets)
- Create dashboard page component (home page after login)
- Display key metrics in cards/tiles (total, open, resolved, closed)
- Show tickets by status chart (pie or bar chart)
- Show tickets by category chart
- Display recent tickets table with quick links
- Add quick filter buttons (e.g., "My Open Tickets", "Unassigned", "Urgent")
- Add date range filter for stats
- Make dashboard the default landing page after login

### Deliverables
- Dashboard with real-time ticket statistics
- Visual charts for status and category breakdown
- Recent tickets view
- Quick filter shortcuts

---

## Phase 8: Polish & Deployment

### Goals
Final validation, error handling, UI polish, Docker setup, and deployment.

### Tasks
- Add loading spinners for all async operations
- Implement error boundaries in React
- Show user-friendly error messages
- Add toast notifications for success/error feedback
- Add client-side form validation for all forms
- Implement server-side validation with proper error messages
- Show inline validation errors
- Prevent duplicate form submissions
- Ensure mobile-friendly responsive layout
- Test on different screen sizes
- Optimize table views for mobile
- Add basic accessibility (ARIA labels, keyboard navigation)
- Ensure sufficient color contrast
- Create Dockerfile for backend
- Create Dockerfile for frontend
- Create docker-compose.yml for full stack
- Configure environment variables for production
- Test full application locally with Docker
- Write deployment documentation
- Deploy PostgreSQL database (managed hosting)
- Deploy backend to Railway/Render/Heroku
- Deploy frontend to Vercel/Netlify or same platform as backend
- Configure production environment variables
- Test deployed application end-to-end
- Create basic user guide for agents
- Document API endpoints

### Deliverables
- Polished UI with loading states and error handling
- Responsive design for mobile and desktop
- Docker setup for easy deployment
- Application deployed and accessible
- Documentation for users and developers

---

## Success Criteria

- [ ] System can receive emails via webhook and create tickets automatically
- [ ] AI classifies tickets into correct categories
- [ ] AI generates relevant suggested responses
- [ ] Agents can edit and send responses via email
- [ ] Admin can manage users (agents) and knowledge base
- [ ] Dashboard shows real-time ticket metrics
- [ ] Application is responsive and user-friendly
- [ ] Application is deployed and accessible via web browser
- [ ] Email threading works correctly (replies link to original tickets)
- [ ] Role-based access control prevents unauthorized actions

---

## Technology Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma ORM
- bcrypt (password hashing)
- @anthropic-ai/sdk (Claude API)
- Nodemailer (email sending)
- Express session middleware

### Frontend
- React
- TypeScript
- React Router
- Axios or Fetch API
- CSS framework (Tailwind CSS or Material-UI)
- React Hook Form (form handling)
- Chart library (Chart.js or Recharts)

### Deployment
- Docker + Docker Compose
- Railway/Render/Heroku (backend hosting)
- Vercel/Netlify (frontend hosting, optional)
- Managed PostgreSQL (Render, Railway, or similar)

### Email
- SendGrid/Mailgun/similar (inbound webhook)
- SMTP service for outbound (can use same provider)

---

## Estimated Timeline

- **Phase 1**: 2-3 days
- **Phase 2**: 2-3 days
- **Phase 3**: 2-3 days
- **Phase 4**: 4-5 days
- **Phase 5**: 5-6 days
- **Phase 6**: 3-4 days
- **Phase 7**: 2-3 days
- **Phase 8**: 3-4 days

**Total**: ~23-31 days (single developer, full-time)

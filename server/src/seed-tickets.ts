import "dotenv/config";
import { prisma } from "./auth.js";
import { TicketStatus, TicketCategory } from "../../core/src/schemas/ticket.js";

const categories = [
  TicketCategory.TECHNICAL_QUESTION,
  TicketCategory.GENERAL_QUESTION,
  TicketCategory.REFUND_REQUEST,
];

const statuses = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.RESOLVED,
  TicketStatus.CLOSED,
];

const sampleTicketsData = [
  {
    senderName: "Sarah Connor",
    senderEmail: "sarah.connor@cyberdyne.io",
    subject: "Unable to access API keys dashboard after password reset",
    body: "Hi team, I reset my password earlier today, but now when I navigate to Developer Settings -> API Keys, the page hangs and displays a blank screen.",
    category: TicketCategory.TECHNICAL_QUESTION,
    status: TicketStatus.OPEN,
  },
  {
    senderName: "David Miller",
    senderEmail: "david.m@acme-corp.com",
    subject: "Accidental double charge for Enterprise Annual License",
    body: "Hello Billing Support, Our company card was charged twice ($1,188 x 2) on August 14th for invoice #INV-40291. Kindly issue a refund for the duplicate transaction.",
    category: TicketCategory.REFUND_REQUEST,
    status: TicketStatus.OPEN,
  },
  {
    senderName: "Elena Rostova",
    senderEmail: "elena.r@innovate.tech",
    subject: "How do I transfer workspace ownership to another team member?",
    body: "Hi there! I am leaving the organization next week and need to transfer the primary Administrator role of our Helpdesk workspace to alex.smith@innovate.tech.",
    category: TicketCategory.GENERAL_QUESTION,
    status: TicketStatus.RESOLVED,
  },
  {
    senderName: "Marcus Vance",
    senderEmail: "m.vance@cloudnetworks.org",
    subject: "Webhook delivery failure: 504 Gateway Timeout",
    body: "We are noticing webhook events from your platform timing out when delivering to our endpoint https://hooks.cloudnetworks.org/inbound-events. Please check server logs.",
    category: TicketCategory.TECHNICAL_QUESTION,
    status: TicketStatus.IN_PROGRESS,
  },
  {
    senderName: "Chloe Dupont",
    senderEmail: "chloe@designhub.fr",
    subject: "Requesting invoice receipt for Q3 subscription",
    body: "Could you please send an official VAT tax invoice for our latest quarterly payment? Need it for audit compliance.",
    category: TicketCategory.GENERAL_QUESTION,
    status: TicketStatus.CLOSED,
  },
  {
    senderName: "Robert Chen",
    senderEmail: "r.chen@fintechsolutions.com",
    subject: "Refund request for unused unused seat add-ons",
    body: "We downgraded our team plan from 25 seats to 10 seats last Monday. Requesting pro-rated refund for remaining billing cycle.",
    category: TicketCategory.REFUND_REQUEST,
    status: TicketStatus.IN_PROGRESS,
  },
  {
    senderName: "Aisha Patel",
    senderEmail: "aisha.patel@globaltech.co.uk",
    subject: "SSO SAML login loop error with Okta integration",
    body: "Our employees are getting stuck in an infinite redirect loop when logging in via Okta SAML 2.0 SSO. Azure AD works fine.",
    category: TicketCategory.TECHNICAL_QUESTION,
    status: TicketStatus.OPEN,
  },
  {
    senderName: "Liam O'Connor",
    senderEmail: "liam@dublindevs.ie",
    subject: "What is the maximum file attachment size limit for tickets?",
    body: "Hi, we tried attaching a 25MB log file to a support ticket, but it gave an upload error. What is the maximum allowed attachment size?",
    category: TicketCategory.GENERAL_QUESTION,
    status: TicketStatus.RESOLVED,
  },
  {
    senderName: "Sophia Martinez",
    senderEmail: "sophia.m@brightdesigns.net",
    subject: "Charged full subscription fee after canceling during 14-day trial",
    body: "I canceled our subscription on Day 10 of the free trial, but $49 was still deducted from my card yesterday.",
    category: TicketCategory.REFUND_REQUEST,
    status: TicketStatus.OPEN,
  },
  {
    senderName: "Kenji Sato",
    senderEmail: "kenji.sato@tokyo-systems.jp",
    subject: "Database connection latency spike in AP-East region",
    body: "High database latency observed between 03:00 UTC and 05:00 UTC today. Queries taking >4500ms to resolve.",
    category: TicketCategory.TECHNICAL_QUESTION,
    status: TicketStatus.IN_PROGRESS,
  },
  {
    senderName: "Hannah Abbott",
    senderEmail: "hannah.abbott@hogwarts-edu.org",
    subject: "Bulk CSV user import failing on row 142",
    body: "Uploading users.csv fails with error 'Invalid string length'. Row 142 contains special accented characters.",
    category: TicketCategory.TECHNICAL_QUESTION,
    status: TicketStatus.OPEN,
  },
  {
    senderName: "Carlos Santana",
    senderEmail: "carlos@latin-grooves.com",
    subject: "Upgraded plan by mistake, want to revert to Basic Plan",
    body: "Selected Pro tier by accident instead of Starter tier. Need help downgrading and adjusting invoice amount.",
    category: TicketCategory.REFUND_REQUEST,
    status: TicketStatus.RESOLVED,
  },
  {
    senderName: "Emily Watson",
    senderEmail: "emily.w@horizon.org",
    subject: "Is IP Whitelisting available on the Growth plan?",
    body: "Hi Team, We want to restrict dashboard access to our company VPN IPs. Is IP Whitelisting supported on Growth plan?",
    category: TicketCategory.GENERAL_QUESTION,
    status: TicketStatus.CLOSED,
  },
  {
    senderName: "Vikram Malhotra",
    senderEmail: "v.malhotra@mumbai-tech.in",
    subject: "CORS preflight request blocked on POST /api/tickets",
    body: "Origin http://app.mumbai-tech.in is blocked by CORS policy. Please update Allowed Origins setting in dashboard.",
    category: TicketCategory.TECHNICAL_QUESTION,
    status: TicketStatus.OPEN,
  },
  {
    senderName: "Jessica Alba",
    senderEmail: "jessica@honest-co.com",
    subject: "Billing currency change from USD to EUR",
    body: "Our European entity handles accounts payable now. Can we change our subscription billing currency to EUR?",
    category: TicketCategory.GENERAL_QUESTION,
    status: TicketStatus.RESOLVED,
  },
  {
    senderName: "Thomas Wright",
    senderEmail: "thomas.w@apex-engineering.com",
    subject: "System outage during scheduled maintenance window",
    body: "Production database went offline 30 minutes before announced maintenance window start time. Urgent update requested.",
    category: TicketCategory.TECHNICAL_QUESTION,
    status: TicketStatus.CLOSED,
  },
  {
    senderName: "Nadia Ali",
    senderEmail: "nadia.ali@cairo-solutions.eg",
    subject: "Requesting refund due to service downtime",
    body: "Due to 4 hours of unexpected downtime on August 10th during peak sales hours, we request SLA outage credit/refund.",
    category: TicketCategory.REFUND_REQUEST,
    status: TicketStatus.IN_PROGRESS,
  },
  {
    senderName: "Oliver Smith",
    senderEmail: "oliver.smith@sydney-digital.au",
    subject: "Two-Factor Authentication SMS not arriving in Australia (+61)",
    body: "None of our team members in Sydney are receiving 2FA SMS verification codes today.",
    category: TicketCategory.TECHNICAL_QUESTION,
    status: TicketStatus.OPEN,
  },
  {
    senderName: "Maria Garcia",
    senderEmail: "m.garcia@madrid-analytics.es",
    subject: "How to export ticket historical metrics data via REST API?",
    body: "We want to pull ticket resolution time metrics into our PowerBI dashboard. Is there an endpoint for raw ticket metrics?",
    category: TicketCategory.GENERAL_QUESTION,
    status: TicketStatus.RESOLVED,
  },
  {
    senderName: "Daniel Kim",
    senderEmail: "daniel.k@seoul-gaming.kr",
    subject: "Duplicate subscription created under secondary email",
    body: "Created a second account under daniel.k@seoul-gaming.kr while testing. Please merge accounts and refund second charge.",
    category: TicketCategory.REFUND_REQUEST,
    status: TicketStatus.OPEN,
  },
];

async function seed50Tickets() {
  console.log("Seeding 50 diverse support tickets into database...");

  // Generate 50 realistic tickets by combining base samples with varied timestamps and parameters
  const fullTickets = [];
  const baseCount = sampleTicketsData.length;

  for (let i = 0; i < 50; i++) {
    const base = sampleTicketsData[i % baseCount];
    if (!base) continue;
    const cat = categories[i % categories.length];
    const stat = statuses[i % statuses.length];

    // Distribute createdAt over past 30 days
    const pastMinutes = (50 - i) * 850 + Math.floor(Math.random() * 120);
    const createdAtDate = new Date(Date.now() - pastMinutes * 60 * 1000);

    fullTickets.push({
      subject: i >= baseCount ? `[Ticket #${i + 101}] ${base.subject}` : base.subject,
      body: base.body,
      senderName: base.senderName,
      senderEmail: i >= baseCount ? `user_${i + 1}@domain.org` : base.senderEmail,
      category: cat,
      status: stat,
      createdAt: createdAtDate,
      updatedAt: createdAtDate,
    });
  }

  // Insert into database
  for (const t of fullTickets) {
    await prisma.ticket.create({
      data: t,
    });
  }

  const count = await prisma.ticket.count();
  console.log(`✓ Successfully seeded tickets! Total tickets in database: ${count}`);
  process.exit(0);
}

seed50Tickets().catch((e) => {
  console.error("✗ Error seeding tickets:", e);
  process.exit(1);
});

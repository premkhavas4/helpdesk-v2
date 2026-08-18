import { z } from "zod";

export const TicketStatus = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketCategory = {
  GENERAL_QUESTION: "General question",
  TECHNICAL_QUESTION: "Technical question",
  REFUND_REQUEST: "Refund request",
} as const;

export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory];

export const createTicketFromEmailSchema = z.object({
  senderName: z.string().min(1, "Sender name is required."),
  senderEmail: z.string().email("Invalid sender email address."),
  subject: z.string().min(1, "Subject is required."),
  body: z.string().min(1, "Ticket body is required."),
  category: z.enum([
    TicketCategory.GENERAL_QUESTION,
    TicketCategory.TECHNICAL_QUESTION,
    TicketCategory.REFUND_REQUEST,
  ]).optional(),
});

export type CreateTicketFromEmailInput = z.infer<typeof createTicketFromEmailSchema>;

export const assignTicketSchema = z.object({
  assignedTo: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
});

export type AssignTicketInput = z.infer<typeof assignTicketSchema>;

export const SenderType = {
  AGENT: "agent",
  CUSTOMER: "customer",
} as const;

export type SenderType = (typeof SenderType)[keyof typeof SenderType];

export const createReplySchema = z.object({
  message: z.string().min(1, "Reply message is required."),
  agentId: z.string().optional(),
  senderType: z.enum([SenderType.AGENT, SenderType.CUSTOMER]).optional().default(SenderType.AGENT),
});

export type CreateReplyInput = z.infer<typeof createReplySchema>;

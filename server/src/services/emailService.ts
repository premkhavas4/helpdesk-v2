import nodemailer from "nodemailer";

interface SendReplyParams {
  toEmail: string;
  recipientName?: string;
  ticketId: number;
  subject: string;
  replyBody: string;
}

/**
 * Creates Nodemailer SMTP Transporter dynamically from process.env
 */

export function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  const cleanPass = pass.replace(/\s+/g, "");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587/other ports
    auth: {
      user,
      pass: cleanPass,
    },
  });
}

/**
 * Sends outbound email reply to customer with threading headers
 */
export async function sendTicketReplyEmail({
  toEmail,
  recipientName = "Customer",
  ticketId,
  subject,
  replyBody,
}: SendReplyParams): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn(
      `[Email Service] ⚠️ SMTP_USER / SMTP_PASSWORD not set in .env. Skipping email send to ${toEmail}.`
    );
    return false;
  }

  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const formattedSubject = subject.toLowerCase().startsWith("re:")
    ? subject
    : `Re: [Ticket #${ticketId}] ${subject}`;

  const messageThreadId = `<ticket-${ticketId}@helpdesk.local>`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #2563eb; padding: 16px 24px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 18px;">Helpdesk Support Reply</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Ticket #${ticketId}</p>
      </div>
      <div style="padding: 24px;">
        <p>Hello ${recipientName},</p>
        <p style="white-space: pre-wrap; background-color: #f8fafc; padding: 16px; border-left: 4px solid #2563eb; border-radius: 4px;">${replyBody}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b;">This email was sent regarding Ticket #${ticketId}. Reply directly to this email to update the ticket.</p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `Helpdesk Support <${fromEmail}>`,
      to: toEmail,
      subject: formattedSubject,
      text: replyBody,
      html: htmlContent,
      headers: {
        "In-Reply-To": messageThreadId,
        References: messageThreadId,
      },
    });

    console.log(`[Email Service] ✓ Outbound email sent to ${toEmail} for Ticket #${ticketId} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[Email Service] ✗ Failed to send email to ${toEmail}:`, error);
    return false;
  }
}

import { test, expect } from "@playwright/test";

const apiUrl = process.env.API_URL || "http://localhost:3000";

test.describe("Inbound Email Webhook E2E Tests", () => {
  test("creates a new ticket from incoming email webhook payload (happy path)", async ({ request }) => {
    const payload = {
      senderName: "Mosh Hamedani",
      senderEmail: "mosh.webhook@example.com",
      subject: "Inbound Email Webhook Test",
      body: "This is a test email sent to the support webhook to convert into a ticket.",
      category: "Technical question",
    };

    const response = await request.post(`${apiUrl}/api/webhooks/email`, {
      data: payload,
    });

    expect(response.status()).toBe(201);
    const json = await response.json();
    expect(json.message).toContain("successfully");
    expect(json.ticket).toBeDefined();
    expect(json.ticket.id).toBeDefined();
    expect(typeof json.ticket.id).toBe("number");
    expect(json.ticket.senderName).toBe("Mosh Hamedani");
    expect(json.ticket.senderEmail).toBe("mosh.webhook@example.com");
    expect(json.ticket.status).toBe("open");
  });

  test("creates a ticket via inbound route without optional category", async ({ request }) => {
    const payload = {
      senderName: "John Doe",
      senderEmail: "john.doe@example.com",
      subject: "General Support Query",
      body: "Need help regarding billing invoice details.",
    };

    const response = await request.post(`${apiUrl}/api/tickets/inbound`, {
      data: payload,
    });

    expect(response.status()).toBe(201);
    const json = await response.json();
    expect(json.ticket).toBeDefined();
    expect(json.ticket.senderName).toBe("John Doe");
    expect(json.ticket.category).toBeNull();
  });

  test("returns 400 validation error when senderName or senderEmail is missing", async ({ request }) => {
    const invalidPayload = {
      senderEmail: "invalid-email",
      subject: "Missing Name Test",
      body: "Testing validation error",
    };

    const response = await request.post(`${apiUrl}/api/webhooks/email`, {
      data: invalidPayload,
    });

    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Validation failed");
  });
});

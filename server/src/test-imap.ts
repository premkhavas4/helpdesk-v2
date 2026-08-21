import "dotenv/config";
import { ImapFlow } from "imapflow";

async function test() {
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASSWORD!.replace(/\s+/g, "");

  console.log("Connecting to IMAP...", user);
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
  });

  try {
    await client.connect();
    console.log("SUCCESSFULLY CONNECTED TO GMAIL IMAP!");
    const status = await client.status("INBOX", { messages: true });
    console.log("INBOX STATUS:", status);
    await client.logout();
  } catch (err: any) {
    console.error("IMAP ERROR:", err?.message || err);
  } finally {
    process.exit(0);
  }
}

test();

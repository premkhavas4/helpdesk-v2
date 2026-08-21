import "dotenv/config";
import { getTransporter } from "./services/emailService.js";

async function verifySmtp() {
  const transporter = getTransporter();
  if (!transporter) {
    console.error("❌ SMTP Credentials missing in .env");
    process.exit(1);
  }

  try {
    console.log("Testing SMTP connection with Gmail...");
    await transporter.verify();
    console.log("✅ SMTP Connection Successful! Your email credentials and App Password are valid.");
  } catch (error: any) {
    console.error("❌ SMTP Verification Failed:", error?.message || error);
  } finally {
    process.exit(0);
  }
}

verifySmtp();

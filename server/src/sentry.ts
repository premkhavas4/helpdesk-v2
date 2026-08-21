import * as Sentry from "@sentry/node";

/**
 * Initializes Sentry for backend error logging if SENTRY_DSN is configured
 */
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (dsn && dsn.trim() !== "" && !dsn.includes("your-sentry-dsn")) {
    try {
      Sentry.init({
        dsn,
        environment: process.env.NODE_ENV || "development",
        tracesSampleRate: 1.0,
      });
      console.log("✓ Sentry error logging initialized for backend");
    } catch (err: any) {
      console.warn("⚠️ Sentry initialization warning:", err?.message || err);
    }
  } else {
    console.log("ℹ️ SENTRY_DSN not set in server/.env (Skipping backend Sentry initialization).");
  }
}

export { Sentry };

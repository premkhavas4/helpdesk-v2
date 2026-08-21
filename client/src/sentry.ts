import * as Sentry from "@sentry/react";

/**
 * Initializes Sentry error logging for frontend if VITE_SENTRY_DSN is configured
 */
export function initFrontendSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (dsn && typeof dsn === "string" && dsn.trim() !== "" && !dsn.includes("your-sentry-dsn")) {
    try {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE || "development",
        tracesSampleRate: 1.0,
      });
      console.log("✓ Sentry error logging initialized for frontend");
    } catch (err: any) {
      console.warn("⚠️ Frontend Sentry initialization warning:", err?.message || err);
    }
  } else {
    console.log("ℹ️ VITE_SENTRY_DSN not set in client/.env (Skipping frontend Sentry initialization).");
  }
}

export { Sentry };

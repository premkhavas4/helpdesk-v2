# Playwright E2E Agent

## Purpose

This agent provides end‑to‑end testing for the **HELPDESK** web application using Playwright.  It is configured to run on the **client** side (Vite dev server) and **server** side (Express API).  Tests are written in TypeScript and can be executed via `bun test:e2e`.

## Installation

Add the required dependencies:

```bash
cd client
bun add -D @playwright/test
bun dlv @playwright/test
```

Create a `playwright.config.ts` in the `client` root:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.VITE_API_URL ?? 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'WebKit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

## Running Tests

```bash
# In the client folder
bun test:e2e
```

Add a script to `client/package.json`:

```json
"scripts": {
  "test:e2e": "playwright test"
}
```

## Sample Test

Create `client/tests/e2e/login.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test('should allow agent to login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name=email]', 'agent@example.com');
    await page.fill('input[name=password]', 'password123');
    await page.click('button:has-text("Login")');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toHaveText('Agent Dashboard');
  });
});
```

## Integration with CI

Add the following to your CI workflow (GitHub Actions example):

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: bun
      - run: cd client && bun install
      - run: cd client && bun run test:e2e
```

## Notes

- The agent is generic and can be expanded with additional fixtures.
- For mocking the backend, consider using `msw` or a test alias in `playwright.config.ts`.
- Ensure the server is running (or mock API) before executing the tests.

---

Feel free to adapt the configuration to your environment or testing strategy.

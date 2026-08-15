import { test, expect } from '@playwright/test';

// Base URL for the client
const baseUrl = process.env.VITE_API_URL ?? 'http://localhost:5173';

test.describe('Authentication Flow', () => {
  test('login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminPassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'wrongPassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('missing email or password shows validation error', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('remember me persists session', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'adminPassword');
    await page.check('input[name="remember"]');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    // Close and reopen page to simulate restart
    await page.context().close();
    const context = await test.browser.newContext();
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');
    await expect(newPage.locator('text=Welcome')).toBeVisible();
  });

  test('logout clears session', async ({ page }) => {
    // Assume logged in
    await page.goto('/dashboard');
    await page.click('button#logout');
    await expect(page).toHaveURL('/login');
    // Revisit dashboard should redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});

import { test, expect } from "@playwright/test";

const clientUrl = process.env.VITE_API_URL || "http://localhost:5173";

test.describe("User Management E2E (Happy Paths)", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Login Page
    await page.goto(`${clientUrl}/login`);

    // Perform Login as Admin (if login form exists)
    const emailInput = page.locator('input[name="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill("admin@example.com");
      await page.fill('input[name="password"]', "admin123");
      await page.click('button[type="submit"]');
    }

    // Navigate to Users Management page
    await page.goto(`${clientUrl}/users`);
  });

  test("Read: displays User Management dashboard and user list", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("User Management");
    await expect(page.getByText("Manage team members, roles, and platform permissions.")).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  test("Create: adds a new team member successfully", async ({ page }) => {
    const testEmail = `newagent_${Date.now()}@example.com`;

    // Click 'Add User' button
    await page.getByRole("button", { name: /Add User/i }).click();
    await expect(page.getByText("Create New Team Member")).toBeVisible();

    // Fill in new user form
    await page.locator('input[name="name"]').fill("Test Agent");
    await page.locator('input[name="email"]').fill(testEmail);
    await page.locator('input[name="password"]').fill("Password123!");
    await page.locator('select[name="role"]').selectOption("agent");

    // Submit form
    await page.getByRole("button", { name: "Save Member" }).click();

    // Verify modal closes and new user appears in table
    await expect(page.getByText("Create New Team Member")).not.toBeVisible();
    await expect(page.getByText(testEmail)).toBeVisible();
  });

  test("Update: edits an existing team member details", async ({ page }) => {
    const userRow = page.locator("tr", { hasText: "Agent One" }).first();

    if (await userRow.isVisible()) {
      // Click edit button for Agent One
      await userRow.getByRole("button", { name: /Edit/i }).click();

      await expect(page.getByText("Edit Team Member")).toBeVisible();

      // Update name
      const nameInput = page.locator('input[name="name"]');
      await nameInput.clear();
      await nameInput.fill("Agent One Updated");

      // Submit update form
      await page.getByRole("button", { name: "Update Member" }).click();

      // Verify modal closes and updated name is visible
      await expect(page.getByText("Edit Team Member")).not.toBeVisible();
      await expect(page.getByText("Agent One Updated")).toBeVisible();
    }
  });

  test("Delete: soft-deletes a team member via confirmation modal", async ({ page }) => {
    const userRow = page.locator("tr", { hasText: "agent1@example.com" }).first();

    if (await userRow.isVisible()) {
      // Click delete button
      await userRow.getByRole("button", { name: /Delete/i }).click();

      // Confirm modal opens
      await expect(page.getByText("Delete Team Member")).toBeVisible();
      await expect(page.getByText(/This user will be soft-deleted/i)).toBeVisible();

      // Click Confirm Delete
      await page.getByRole("button", { name: "Confirm Delete" }).click();

      // Verify modal closes and user is removed from active list
      await expect(page.getByText("Delete Team Member")).not.toBeVisible();
      await expect(page.getByText("agent1@example.com")).not.toBeVisible();
    }
  });
});

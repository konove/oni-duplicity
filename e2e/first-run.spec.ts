import { test, expect } from "@playwright/test";

// The screen a first-time visitor actually lands on. Every other e2e file
// calls loadMockSave() first, so until now nothing photographed the editor
// before a save exists - which is the state roadmap 0.11 is about.
test("the landing screen orients someone with no save open", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Edit a saved colony" }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  await expect(page).toHaveScreenshot("landing.png", { fullPage: true });
});

// The greyed run and the note that explains it. Worlds is in the list here
// rather than appearing from nowhere once a save loads.
test("the sidebar says what unlocks its disabled entries", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator("nav");
  // Scoped to the nav: step 2 of the landing copy also ends "...locked until a
  // save is open", and an unscoped match finds both.
  await expect(nav.getByText("Locked until a save is open")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  await expect(nav).toHaveScreenshot("locked-nav.png");
});

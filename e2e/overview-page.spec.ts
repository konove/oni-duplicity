import { test, expect } from "@playwright/test";

import { goToPage, loadMockSave } from "./fixtures";

// The Overview is taller than the viewport, so pages.spec.ts photographs only
// its first screen. These are the two parts below that fold.
test.describe("overview page", () => {
  test.beforeEach(async ({ page }) => {
    await loadMockSave(page);
    await goToPage(page, "#/");
  });

  // Five three-value dropdowns, one per row. They were a two-column grid whose
  // second column was `auto`, which stretched every Select the full width of
  // the page.
  test("difficulty settings read down the page", async ({ page }) => {
    const difficulty = page
      .getByRole("heading", { name: "Difficulty" })
      .locator("xpath=..");

    await expect(difficulty).toHaveScreenshot("difficulty.png");
  });

  // The one sentence that explains why an edited colony does not show up in
  // the game: saving hands back a download rather than writing the file back.
  test("says where the saved file lands", async ({ page }) => {
    const handBack = page.getByText(/Save downloads/).locator("xpath=..");

    await expect(handBack).toHaveScreenshot("hand-back.png");
  });
});

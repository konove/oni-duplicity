import { test, expect } from "@playwright/test";

import { goToPage, loadMockSave } from "./fixtures";

// The row menu is the whole point of the redesign and the page screenshot only
// ever catches it shut. What has to be visible is that each entry names its own
// quantity - a trailing delete button could not say whether it took Shale's
// loose 197.4 t or its stored 200 kg, and this is the fix for that.
test.describe("materials page", () => {
  test.beforeEach(async ({ page }) => {
    await loadMockSave(page);
    await goToPage(page, "#/materials");
    await expect(page.getByRole("cell", { name: /^Shale/ })).toBeVisible();
  });

  test("row menu names the quantity it would delete", async ({ page }) => {
    await page.getByRole("button", { name: "Actions for Shale" }).click();

    const menu = page.getByRole("menu");
    await expect(
      menu.getByRole("menuitem", { name: "Delete 197.4 t lying around" }),
    ).toBeVisible();

    // The page rather than the menu element: a menu is a popover with its own
    // elevation and its box crops to the list, so an element shot comes back as
    // a bare strip of text with no indication of what it is attached to.
    await expect(page).toHaveScreenshot("row-menu.png");
  });

  // The only materials test that drives a delete through the real store rather
  // than a mocked hook. The jsdom spec stops at "the handler was called"; if
  // the reducer stopped filtering the right groups, it would still be green.
  test("deleting a row's loose material empties that row", async ({ page }) => {
    const shale = page.getByRole("row", { name: /^Shale/ });
    await expect(shale.getByText("197.4 t")).toBeVisible();

    await page.getByRole("button", { name: "Actions for Shale" }).click();
    await page
      .getByRole("menuitem", { name: "Delete 197.4 t lying around" })
      .click();
    await page.getByRole("button", { name: /confirm/i }).click();

    // The loose pile is gone and the 200 kg in a container is untouched, which
    // is exactly the distinction the old single button could not express.
    await expect(shale.getByText("197.4 t")).toHaveCount(0);
    await expect(shale.getByText("200 kg")).toBeVisible();
  });
});

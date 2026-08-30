import { test, expect, Page } from "@playwright/test";

import { loadMockSave } from "./fixtures";

/**
 * The list cards, at the sizes a save can actually reach.
 *
 * Every level in the bundled example is a single digit, which is why the card
 * survived years of two attribute columns wrapped inside a fixed 240x160 box.
 * A mega duplicant reads +9999 on all eleven, and the second column simply
 * fell off the edge of the card - so the numbers that had changed were the
 * ones you could not read.
 */
async function goToList(page: Page): Promise<void> {
  await loadMockSave(page);
  await page.evaluate(() => {
    window.location.hash = "#/duplicants";
  });
  await expect(page.locator('a[href^="#/duplicants/"]').first()).toBeVisible();
}

/** The card for one duplicant, rather than any Paper on the page. */
function cardFor(page: Page, name: string) {
  return page.locator(".MuiPaper-root").filter({ hasText: name }).first();
}

/**
 * Anything in the card that does not fit the room it has.
 *
 * Both halves matter. A block that overruns its parent reports it on the
 * parent, and a label cut off by `text-overflow` reports it on itself - the
 * old two-column box did the first, and a narrow single column would do the
 * second.
 */
async function clippedText(page: Page, name: string): Promise<string[]> {
  return cardFor(page, name).evaluate((card: HTMLElement) => {
    const elements = [
      card,
      ...Array.from(card.querySelectorAll<HTMLElement>("*")),
    ];
    return elements
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => (el.textContent || "").trim().slice(0, 60))
      .filter(Boolean);
  });
}

test.describe("duplicant list", () => {
  test.beforeEach(async ({ page }) => {
    await goToList(page);
  });

  test("nothing is clipped at ordinary levels", async ({ page }) => {
    expect(await clippedText(page, "Ada")).toEqual([]);
  });

  test("nothing is clipped once a duplicant is maxed out", async ({ page }) => {
    // The editor's own Mega action, which is what produces these numbers.
    await page.locator('button[aria-haspopup="true"]').first().click();
    await page.getByRole("menuitem", { name: /Mega/ }).click();

    await expect(page.getByText("+9999").first()).toBeVisible();
    expect(await clippedText(page, "Ada")).toEqual([]);
  });

  test("a maxed-out card renders", async ({ page }) => {
    await page.locator('button[aria-haspopup="true"]').first().click();
    await page.getByRole("menuitem", { name: /Mega/ }).click();
    await expect(page.getByText("+9999").first()).toBeVisible();

    await expect(cardFor(page, "Ada")).toHaveScreenshot("mega-card.png");
  });
});

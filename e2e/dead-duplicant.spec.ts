import { test, expect, Page } from "@playwright/test";

import { loadMockSave } from "./fixtures";

/**
 * A dead duplicant, marked in the two places the design pass settled on: on the
 * list, which is the only way to find out one died without opening every card,
 * and in the editor's identity band, which says why you are looking at them.
 *
 * The bundled save has no dead duplicant and the editor offers no way to kill
 * one, so `killMockDuplicant()` (src/debug.ts, dev builds only) flips the
 * faction alignment that dying actually clears.
 */
async function goToList(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.location.hash = "#/duplicants";
  });
  await expect(page.locator('a[href^="#/duplicants/"]').first()).toBeVisible();
}

async function kill(page: Page): Promise<number> {
  const id = await page.evaluate(() => {
    const fn = (window as unknown as { killMockDuplicant?: () => number })
      .killMockDuplicant;
    if (!fn) {
      throw new Error("killMockDuplicant() is missing - is this a dev build?");
    }
    return fn();
  });
  return id;
}

test.describe("dead duplicant", () => {
  test.beforeEach(async ({ page }) => {
    await loadMockSave(page);
    await goToList(page);
  });

  test("the list says nothing until someone dies", async ({ page }) => {
    await expect(page.getByText("Dead", { exact: true })).toHaveCount(0);

    await kill(page);

    // Exactly one - the other two cards are untouched, which is the half of
    // this that a screenshot of the dead card alone would not catch.
    await expect(page.getByText("Dead", { exact: true })).toHaveCount(1);
  });

  test("the dead card renders", async ({ page }) => {
    await kill(page);
    const card = page.locator(".MuiPaper-root").filter({ hasText: "Ada" });
    await expect(card.getByText("Dead", { exact: true })).toBeVisible();
    await expect(card).toHaveScreenshot("dead-card.png");
  });

  test("a living card is unchanged beside it", async ({ page }) => {
    await kill(page);
    const card = page.locator(".MuiPaper-root").filter({ hasText: "Bruno" });
    await expect(card).toHaveScreenshot("living-card.png");
  });

  test("the editor marks them and offers Revive", async ({ page }) => {
    const id = await kill(page);
    await page.evaluate((i) => {
      window.location.hash = `/duplicants/${i}`;
    }, id);
    await expect(page.getByRole("tab", { name: /appearance/i })).toBeVisible();

    await expect(page.getByText("Dead", { exact: true })).toBeVisible();

    // The whole band: the portrait wrapper, then the band itself. Framing the
    // portrait alone would photograph a grey head and miss the chip beside
    // the name, which is the other half of the marker.
    const band = page.locator("[data-duplicant-portrait]").locator("../..");
    await expect(band).toHaveScreenshot("dead-band.png");

    await page.locator('button[aria-haspopup="true"]').click();
    const revive = page.getByRole("menuitem", { name: "Revive" });
    await expect(revive).toBeVisible();

    await revive.click();

    // The whole loop: the write lands, and the marker goes away because the
    // duplicant is genuinely back in the faction.
    await expect(page.getByText("Dead", { exact: true })).toHaveCount(0);
  });

  test("a living duplicant is offered no Revive", async ({ page }) => {
    const href = await page.evaluate(() => {
      const link = document.querySelector<HTMLAnchorElement>(
        'a[href^="#/duplicants/"]',
      );
      return link ? link.getAttribute("href") : null;
    });
    await page.evaluate((h) => {
      window.location.hash = (h as string).slice(1);
    }, href as string);
    await expect(page.getByRole("tab", { name: /appearance/i })).toBeVisible();

    await page.locator('button[aria-haspopup="true"]').click();
    // Omitted rather than disabled, so it is absent from the menu entirely.
    await expect(page.getByRole("menuitem", { name: "Revive" })).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: /Clone/ })).toBeVisible();
  });
});

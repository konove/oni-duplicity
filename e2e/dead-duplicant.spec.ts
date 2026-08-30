import { test, expect, Page } from "@playwright/test";

import { loadMockSave, waitForSprites } from "./fixtures";

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
  await waitForSprites(page);
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
    await expect(page.getByRole("button", { name: "Actions" })).toBeVisible();

    // A banner across the top, because almost nobody opens a dead duplicant to
    // adjust their Machinery - they came to bring them back.
    const banner = page.getByText(
      "Attributes, traits and skills are untouched.",
    );
    await expect(banner).toBeVisible();
    await expect(page.getByText("Ada is")).toBeVisible();
    await expect(page.getByText("Dead", { exact: true })).toBeVisible();

    await expect(page.locator("[data-editor-page]")).toHaveScreenshot(
      "dead-banner.png",
    );

    // The one thing they came for, one click away rather than in a menu.
    await page.getByRole("button", { name: "Revive" }).click();

    // The whole loop: the write lands, and the banner goes because the
    // duplicant is genuinely alive again.
    await expect(banner).toHaveCount(0);
    await expect(page.getByText("Dead", { exact: true })).toHaveCount(0);
  });

  // The banner costs 56px of a screen whose premise is fitting in 720, so it
  // is only there when there is something to say - and the columns still fit
  // underneath it when it is.
  test("the editor still fits with the banner up", async ({ page }) => {
    const id = await kill(page);
    await page.evaluate((i) => {
      window.location.hash = `/duplicants/${i}`;
    }, id);
    await expect(page.getByRole("button", { name: "Actions" })).toBeVisible();

    const overflow = await page.evaluate(() => {
      const root = document.querySelector("[data-editor-root]");
      return root ? root.scrollHeight - root.clientHeight : -1;
    });
    expect(overflow, "the editor should not scroll").toBeLessThanOrEqual(0);
  });
});

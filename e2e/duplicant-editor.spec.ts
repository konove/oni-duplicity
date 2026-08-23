import { test, expect } from "@playwright/test";

import { loadMockSave } from "./fixtures";

// Element-level screenshots. A whole-page shot hides a small control changing;
// framing one component keeps the baseline tight and the diff readable.
test.describe("duplicant editor", () => {
  test.beforeEach(async ({ page }) => {
    await loadMockSave(page);

    // Editor links only exist once the list has rendered its cards.
    await page.evaluate(() => {
      window.location.hash = "#/duplicants";
    });
    await expect(
      page.locator('a[href^="#/duplicants/"]').first(),
    ).toBeVisible();

    // The list link is "#/duplicants"; an editor link carries an id after it.
    const href = await page.evaluate(() => {
      const link = document.querySelector<HTMLAnchorElement>(
        'a[href^="#/duplicants/"]',
      );
      return link ? link.getAttribute("href") : null;
    });
    expect(
      href,
      "the mock save should contain at least one duplicant",
    ).not.toBeNull();

    await page.evaluate((h) => {
      window.location.hash = h.slice(1);
    }, href as string);
    await expect(page.getByRole("tab", { name: /appearance/i })).toBeVisible();
  });

  test("editor renders", async ({ page }) => {
    await expect(page).toHaveScreenshot("editor.png", { fullPage: true });
  });

  // The appearance grid is a row of ButtonBase controls, one per hairstyle. Its
  // container element has changed before - a div with onClick became a real
  // button so keyboard users could reach it - and that swap is invisible in
  // prose review. This is the shot that catches it reflowing.
  test("appearance picker renders", async ({ page }) => {
    await page.getByRole("tab", { name: /appearance/i }).click();
    const firstOption = page.getByRole("button", { name: /^Hair 1$/ });
    await expect(firstOption).toBeVisible();
    await expect(firstOption).toHaveScreenshot("appearance-option.png");
  });

  // The focus ring is drawn with `outlineOffset`, which paints OUTSIDE the
  // element's box. An element-level screenshot clips to that box and so cannot
  // see it - the shot came out byte-identical to the unfocused one. Clip a
  // slightly larger region of the page instead.
  test("appearance option shows a focus ring when focused", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: /appearance/i }).click();
    const firstOption = page.getByRole("button", { name: /^Hair 1$/ });

    // Tab to it rather than calling .focus(). MUI applies focusVisibleClassName
    // only when the browser reports :focus-visible, and programmatic focus does
    // not qualify - a .focus() version of this test passes with the ring
    // deleted, which is worse than no test.
    await page.getByRole("tab", { name: /appearance/i }).focus();
    let reached = false;
    for (let i = 0; i < 40 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await firstOption.evaluate(
        (el) => el === document.activeElement,
      );
    }
    expect(
      reached,
      "the first appearance option should be reachable by Tab",
    ).toBe(true);

    const box = await firstOption.boundingBox();
    expect(box, "the focused option should be laid out").not.toBeNull();
    const margin = 8;
    await expect(page).toHaveScreenshot("appearance-option-focused.png", {
      clip: {
        x: box!.x - margin,
        y: box!.y - margin,
        width: box!.width + margin * 2,
        height: box!.height + margin * 2,
      },
    });
  });
});

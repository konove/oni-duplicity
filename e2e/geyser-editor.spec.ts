import { test, expect, Page } from "@playwright/test";

import { goToPage, loadMockSave } from "./fixtures";

// The geyser card is now taller than the viewport, and the page's own scroll
// container means a fullPage shot of #/geysers stops before the summary block.
// Framing the card itself is the only way to photograph the part that reports
// what the game will show.
test.describe("geyser editor", () => {
  // Tall enough for the whole card. The page scrolls in its own container, not
  // the document, and capturing an element past the bottom of the viewport
  // through one of those comes back with the overflow painted black.
  test.use({ viewport: { width: 1280, height: 1100 } });

  test.beforeEach(async ({ page }) => {
    await loadMockSave(page);
    await goToPage(page, "#/geysers");
    await expect(
      page.getByRole("button", { name: /best case/i }),
    ).toBeVisible();
  });

  // The card is the only Paper holding the Best case button - the app bar is a
  // Paper too, which is why this filters rather than taking the first one.
  const geyserCard = (page: Page) =>
    page
      .locator(".MuiPaper-root")
      .filter({ has: page.getByRole("button", { name: /best case/i }) });

  test("card renders", async ({ page }) => {
    const card = geyserCard(page);
    await expect(card).toHaveCount(1);

    await expect(card).toHaveScreenshot("geyser-card.png");
  });

  // The only test that drives an edit through the real store rather than a
  // mocked hook: the jsdom specs stop at "the handler was called". If the
  // reducer's deep merge stopped landing, everything else would still be green.
  test("best case moves three sliders and then greys itself out", async ({
    page,
  }) => {
    const card = geyserCard(page);
    const bestCase = page.getByRole("button", { name: /best case/i });

    await bestCase.click();

    // Output and Active to the top of their range, full cycle to the bottom.
    await expect(card.getByText("140 kg/cycle").first()).toBeVisible();
    await expect(card.getByText("80%").first()).toBeVisible();
    await expect(card.getByText("25 cycles").first()).toBeVisible();

    // ...and the eruption timings untouched, which is the half people forget.
    await expect(card.getByText("484 s").first()).toBeVisible();

    await expect(bestCase).toBeDisabled();
    await expect(card).toHaveScreenshot("geyser-card-best-case.png");
  });
});

import { Page, expect } from "@playwright/test";

/**
 * Loads the bundled example colony and waits for the editor to be usable.
 *
 * `loadMockSave()` is exposed on window by src/debug.ts in dev builds only. It
 * parses in the save-serializer worker, so the call returns long before the UI
 * has anything to show - hence the wait on real content rather than a timeout.
 */
export async function loadMockSave(page: Page): Promise<void> {
  await page.goto("/");
  await page.waitForFunction(
    () =>
      typeof (window as unknown as MockSaveWindow).loadMockSave === "function",
  );
  await page.evaluate(() => {
    const load = (window as unknown as MockSaveWindow).loadMockSave;
    if (!load) {
      throw new Error("loadMockSave() is missing - is this a dev build?");
    }
    load();
  });

  // The nav only links past the overview once a save is in state. Scoped to
  // the <nav>: the overview's own "what you can change" cards are links to the
  // same pages, so an unscoped match finds two.
  await expect(
    page.locator("nav").getByRole("link", { name: /duplicants/i }),
  ).toBeVisible({
    timeout: 30_000,
  });
}

interface MockSaveWindow {
  loadMockSave?: () => void;
}

/**
 * Waits for the duplicant sprites to actually be on screen.
 *
 * The portrait layers are `<img>` elements, and Playwright's screenshot
 * stabilisation cannot help with them: it waits for two identical frames, and
 * an empty box is a perfectly stable frame. A shot taken before the sprite
 * arrives is "stable" and simply has no duplicant in it.
 *
 * That is not hypothetical - it is what CI produced on its first run with the
 * screenshots in it: a card whose portrait was missing entirely, 699 pixels
 * different from a baseline generated on the same runner minutes earlier.
 */
export async function waitForSprites(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    Array.from(document.images).every(
      (image) => image.complete && image.naturalWidth > 0,
    ),
  );
  await page.evaluate(() => document.fonts.ready);
}

/** Navigates by hash and settles, so a screenshot is not raced. */
export async function goToPage(page: Page, hash: string): Promise<void> {
  await page.evaluate((h) => {
    window.location.hash = h;
  }, hash);
  await page.waitForLoadState("networkidle");
  await waitForSprites(page);
}

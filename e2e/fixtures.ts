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

  // The nav only links past the overview once a save is in state.
  await expect(page.getByRole("link", { name: /duplicants/i })).toBeVisible({
    timeout: 30_000,
  });
}

interface MockSaveWindow {
  loadMockSave?: () => void;
}

/** Navigates by hash and settles, so a screenshot is not raced. */
export async function goToPage(page: Page, hash: string): Promise<void> {
  await page.evaluate((h) => {
    window.location.hash = h;
  }, hash);
  await page.waitForLoadState("networkidle");
}

import { test, expect } from "@playwright/test";

// react-markdown emits bare <a> elements, which MUI never sees, so they render
// in browser-default blue on a dark page. No baseline here on purpose: the
// changelog's content changes every release, so a pixel comparison of it would
// churn. The computed colour is the thing that must not regress.
test("changelog links use the app's link colour, not the browser default", async ({
  page,
}) => {
  await page.goto("/#/changelog");

  // Scoped to prose: the sidebar's GitHub button is also an <a href="http...">,
  // and it is styled by MUI already.
  const link = page.locator("p a, li a").first();
  await expect(link).toBeVisible();

  await expect(link.evaluate((el) => getComputedStyle(el).color)).resolves.toBe(
    "rgb(144, 202, 249)",
  );
});

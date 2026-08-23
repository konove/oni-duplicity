import { test, expect } from "@playwright/test";

import { goToPage, loadMockSave } from "./fixtures";

// One screenshot per page. These are the regressions that unit tests cannot
// see: a layout that collapses, a control that loses its focus ring, a grid
// that reflows when a component's container element changes.
const PAGES = [
  { name: "overview", hash: "#/" },
  { name: "duplicants", hash: "#/duplicants" },
  { name: "creatures", hash: "#/creatures" },
  { name: "geysers", hash: "#/geysers" },
  { name: "worlds", hash: "#/worlds" },
  { name: "materials", hash: "#/materials" },
  { name: "raw-editor", hash: "#/raw" },
  { name: "settings", hash: "#/settings" },
];

for (const { name, hash } of PAGES) {
  test(`${name} page renders`, async ({ page }) => {
    await loadMockSave(page);
    await goToPage(page, hash);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}

import { test, expect, Page } from "@playwright/test";

import { loadMockSave } from "./fixtures";

/**
 * The editor shows the whole duplicant at once: identity and traits, the
 * attributes, and the health numbers, in three columns with no tabs. What
 * these check is the promise that makes that worth doing - it all fits.
 */
async function openFirstDuplicant(page: Page): Promise<void> {
  await loadMockSave(page);

  await page.evaluate(() => {
    window.location.hash = "#/duplicants";
  });
  await expect(page.locator('a[href^="#/duplicants/"]').first()).toBeVisible();

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
  await expect(page.getByRole("button", { name: "Actions" })).toBeVisible();
}

test.describe("duplicant editor", () => {
  test.beforeEach(async ({ page }) => {
    await openFirstDuplicant(page);
  });

  test("editor renders", async ({ page }) => {
    await expect(page).toHaveScreenshot("editor.png", { fullPage: true });
  });

  // The whole premise. Five tabs became three columns only because every
  // section got denser; if any of them grows back, this is what says so.
  //
  // A screenshot cannot make this claim on its own - a full-page shot
  // photographs the scrolled-out part too and records a regression as a taller
  // image.
  test("the whole duplicant fits without scrolling", async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport, "the test runs at a fixed viewport").not.toBeNull();

    // The editor's own root is what scrolls, not the document - it is a
    // full-height flex row with overflow of its own. Measuring the page
    // instead reports 720 of 720 however far the columns overflow, which is
    // how a one-column attribute list slipped past this test once already.
    const overflow = await page.evaluate(() => {
      const root = document.querySelector("[data-editor-root]");
      return root ? root.scrollHeight - root.clientHeight : -1;
    });
    expect(overflow, "the editor should not scroll").toBeLessThanOrEqual(0);

    // The last thing in the last column, which is the furthest down anything
    // reaches.
    const last = page.getByText("all 0");
    await expect(last).toBeVisible();
    const box = await last.boundingBox();
    expect(box, "the disease summary should be laid out").not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
  });

  // Eleven germ counters, every one of them zero on a healthy duplicant. That
  // is the kind of row that pushed the numbers people came for off the screen.
  test("the disease counters stay collapsed until asked for", async ({
    page,
  }) => {
    // The summary names the first three, so pick one it does not: Trench
    // Stench is seventh of the eleven.
    await expect(page.getByText("Trench Stench")).toHaveCount(0);

    await page.getByText("all 0").click();

    await expect(page.getByText("Trench Stench")).toBeVisible();
    await expect(page.getByText("Radioactive Contaminants")).toBeVisible();
  });

  // The bar under each health number is a real slider, not a picture of one.
  // It went the other way first - a progress bar with the number beside it -
  // and the complaint was exactly that it looked draggable and was not.
  test("the health sliders write the value back", async ({ page }) => {
    const slider = page.getByRole("slider", { name: "Stress" });
    const field = page.getByRole("textbox", { name: "Stress" });
    await expect(slider).toBeVisible();

    const before = Number((await field.inputValue()).replace(/,/g, ""));
    await slider.focus();
    await page.keyboard.press("ArrowRight");

    // Not an exact number: MUI snaps to its own step grid, and what matters is
    // that the drag reached the save rather than moving a decoration.
    await expect
      .poll(async () => Number((await field.inputValue()).replace(/,/g, "")))
      .toBeGreaterThan(before);
  });

  // A value past the end of its own scale would push the thumb off the rail.
  // The bundled save has a duplicant at 200 breath out of 100.
  test("an off-scale value pins the thumb without changing the number", async ({
    page,
  }) => {
    const slider = page.getByRole("slider", { name: "Breath" });
    await expect(slider).toHaveAttribute("aria-valuenow", "100");
    await expect(page.getByRole("textbox", { name: "Breath" })).toHaveValue(
      "200",
    );
  });

  // What is behind the Actions button, and why it is a labelled button: the
  // two entries that rewrite a duplicant say so, in a sentence that was
  // already written in en/common.json with nothing rendering it.
  test("the actions menu explains the ones that rewrite a duplicant", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Actions" }).click();

    const menu = page.getByRole("menu");
    await expect(
      menu.getByText("Full health and breath, no stress, no disease"),
    ).toBeVisible();
    await expect(
      menu.getByText(
        "Max out every attribute, replace all traits with the good ones, take every interest, and grant full experience",
      ),
    ).toBeVisible();
    await expect(
      menu.getByText("Adds a second duplicant with these settings"),
    ).toBeVisible();

    // Revive is not here. It is the button in the banner, and only a dead
    // duplicant has one.
    await expect(menu.getByRole("menuitem", { name: /Revive/ })).toHaveCount(0);

    await expect(menu).toHaveScreenshot("actions-menu.png");
  });

  test("heal and de-stress clears what is wrong", async ({ page }) => {
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: /Heal and de-stress/ }).click();

    await expect(page.getByRole("textbox", { name: "Stress" })).toHaveValue(
      "0",
    );
    // And it does not quietly cut back a value already past its own scale.
    await expect(page.getByRole("textbox", { name: "Breath" })).toHaveValue(
      "200",
    );
    // Nor feed anybody: heal is not a meal.
    await expect(page.getByRole("textbox", { name: "Calories" })).toHaveValue(
      "3,536,336.75",
    );
  });

  // Thirty-three hairstyles is a browse, not a field, so it moved behind a
  // button. The picker itself is unchanged; that it still opens is the point.
  test("appearance opens as a dialog", async ({ page }) => {
    await page.getByText("Change appearance").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /^Hair 1$/ }),
    ).toBeVisible();
  });

  // The appearance grid is a row of ButtonBase controls, one per hairstyle. Its
  // container element has changed before - a div with onClick became a real
  // button so keyboard users could reach it - and that swap is invisible in
  // prose review. This is the shot that catches it reflowing.
  test("appearance picker renders", async ({ page }) => {
    await page.getByText("Change appearance").click();
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
    await page.getByText("Change appearance").click();
    const firstOption = page.getByRole("button", { name: /^Hair 1$/ });
    await expect(firstOption).toBeVisible();

    // Tab to it rather than calling .focus(). MUI applies focusVisibleClassName
    // only when the browser reports :focus-visible, and programmatic focus does
    // not qualify - a .focus() version of this test passes with the ring
    // deleted, which is worse than no test.
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

test.describe("duplicant editor, narrow", () => {
  test.use({ viewport: { width: 1000, height: 900 } });

  // Three columns need about 1100px. Below that they stack and the page
  // scrolls: the no-scrolling promise goes, everything stays reachable.
  test("the columns stack", async ({ page }) => {
    await openFirstDuplicant(page);

    const identity = page.getByText("Traits", { exact: true });
    const attributes = page.getByText("Attributes — primary");
    await expect(identity).toBeVisible();
    await expect(attributes).toBeVisible();

    const above = await identity.boundingBox();
    const below = await attributes.boundingBox();
    expect(above, "the identity column should be laid out").not.toBeNull();
    expect(below, "the attributes column should be laid out").not.toBeNull();
    // Stacked, not side by side: the second column starts below the first.
    expect(below!.y).toBeGreaterThan(above!.y);
    expect(Math.abs(below!.x - above!.x)).toBeLessThan(40);
  });
});

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

  // The measured claim behind the identity band: with the name row and the
  // portrait block folded into one 136px strip, the tab content starts high
  // enough that both attribute groups fit at 720 - which they did not before,
  // where "Secondary" was a heading whose fields sat below the fold.
  //
  // A screenshot cannot catch this on its own: a full-page shot photographs
  // the scrolled-out part too, and happily records a regression as a taller
  // image. The count is here so the test cannot pass by rendering nothing;
  // the mock save carries 17 attributes.
  test("both attribute groups fit without scrolling", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Secondary" }),
    ).toBeVisible();

    const fields = page.locator('input[type="number"]');
    await expect(fields).toHaveCount(17);

    const box = await fields.last().boundingBox();
    expect(box, "the last attribute field should be laid out").not.toBeNull();
    const viewport = page.viewportSize();
    expect(viewport, "the test runs at a fixed viewport").not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
  });

  // DuplicantPortrait mounts the head, eyes and hair layers but not the body,
  // so a box sized for a whole duplicant leaves the head in the top two thirds
  // with dead space beneath it. It looked like a portrait that had slipped up.
  //
  // A screenshot cannot defend this on its own: the framing lives in numbers a
  // reviewer cannot read off a baseline, and `--update-snapshots` would accept
  // it slipping back without a word. So measure where the sprite actually
  // paints - screenshot the region, hide the three layers, screenshot again,
  // and diff. Any pixel that changed is sprite.
  test("the portrait sits centred in its box", async ({ page }) => {
    const box = await page.evaluate(() => {
      const el = document.querySelector("[data-duplicant-portrait]");
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    expect(box, "the band should render a portrait").not.toBeNull();

    const margin = 40;
    const clip = {
      x: box!.x - margin,
      y: box!.y - margin,
      width: box!.w + margin * 2,
      height: box!.h + margin * 2,
    };

    const withArt = (await page.screenshot({ clip })).toString("base64");
    await page.addStyleTag({
      content:
        ".duplicant-head, .duplicant-hair, .duplicant-eyes { visibility: hidden !important; }",
    });
    const without = (await page.screenshot({ clip })).toString("base64");

    const ink = await page.evaluate(
      async ([a, b, clipHeight]) => {
        const load = async (data: string) => {
          const img = new Image();
          img.src = "data:image/png;base64," + data;
          await img.decode();
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          return ctx.getImageData(0, 0, canvas.width, canvas.height);
        };
        const A = await load(a as string);
        const B = await load(b as string);
        let top = Infinity;
        let bottom = -Infinity;
        for (let y = 0; y < A.height; y++) {
          for (let x = 0; x < A.width; x++) {
            const i = (y * A.width + x) * 4;
            const delta =
              Math.abs(A.data[i] - B.data[i]) +
              Math.abs(A.data[i + 1] - B.data[i + 1]) +
              Math.abs(A.data[i + 2] - B.data[i + 2]);
            if (delta > 12) {
              if (y < top) top = y;
              if (y > bottom) bottom = y;
            }
          }
        }
        // The shot is in device pixels; the clip was in CSS pixels.
        const scale = A.height / (clipHeight as number);
        return { top: top / scale, bottom: bottom / scale };
      },
      [withArt, without, clip.height],
    );

    const above = ink.top - margin;
    const below = box!.h - (ink.bottom - margin);
    expect(above, "the sprite should paint inside its box").toBeGreaterThan(0);
    // Hair reaches further up on some heads than others, so this is not a
    // pixel-exact claim - but the bug it guards was 11px of overflow above
    // against 44px of empty space below.
    expect(Math.abs(above - below)).toBeLessThan(10);
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

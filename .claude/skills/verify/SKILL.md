---
name: verify
description: Run the full check suite for this repo — typecheck, jest, Playwright screenshots, and a production webpack build — and report what actually passed. Use before committing, after a dependency change, or when asked to confirm the project still builds.
---

Run all four checks and report results honestly, including failures.

```
npm run typecheck     # tsc -p src, then tsc -p tsconfig.node.json
npm test              # jest: logic specs + jsdom component specs
npm run test:e2e      # playwright: screenshot comparison against the dev server
npm run build         # production webpack build
```

On Windows use `npm.cmd` — this machine's PowerShell execution policy is
`AllSigned` and refuses npm's unsigned `npm.ps1`. If `npm` is not found at all,
the shell predates the Node install; refresh with:

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")
```

## Notes

- Run all four even if an early one fails, so the user sees the full picture in
  one pass. Report each outcome separately.
- The build is the slowest step (~10-15s) and emits a large asset listing. Filter
  to the `compiled successfully` / `ERROR in` lines rather than dumping it.
- `npm run test:e2e` starts its own dev server and compares against the committed
  baselines in `e2e/__screenshots__/`. A failure writes `-actual`, `-expected` and
  `-diff` PNGs into `test-results/` — **look at the diff** before deciding whether
  it is a regression or an intended change. Never run `test:e2e:update` to make a
  red run go green without opening the image first.
  Baselines are platform specific; one taken on Windows will not match Linux.
- A clean typecheck does not catch MUI's `theme.spacing()` returning a string:
  `-theme.spacing(1)` is `NaN`, TypeScript allows it, and emotion drops the rule.
  If the diff touches styles, grep for `-theme.spacing` and check computed styles
  in the browser.

## When to go further

The screenshots cover the eight pages and the duplicant editor, so a rendering
change that breaks layout should fail `test:e2e`. They do not cover interaction
beyond what the tests drive, and nothing covers the save pipeline end to end.

If the change touched the save pipeline, compiling is not enough. Start the dev
server, load a save (`loadMockSave()` in the console, or a real `.sav` through the
file input), and check the browser console for errors before calling it verified.
Writing a save is only truly verified by loading the result in the game.

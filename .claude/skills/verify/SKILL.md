---
name: verify
description: Run the full check suite for this repo — typecheck, jest, and a production webpack build — and report what actually passed. Use before committing, after a dependency change, or when asked to confirm the project still builds.
---

Run all three checks and report results honestly, including failures.

```
npm run typecheck     # tsc -p src --noEmit
npm test              # jest
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

- Run all three even if an early one fails, so the user sees the full picture in
  one pass. Report each outcome separately.
- The build is the slowest step (~10-15s) and emits a large asset listing. Filter
  to the `compiled successfully` / `ERROR in` lines rather than dumping it.
- `npm test` currently covers reducers only (`*.spec.ts` beside the sources).
  Passing tests are **not** evidence the UI works — say so if the change touched
  components.
- A clean typecheck does not catch MUI's `theme.spacing()` returning a string:
  `-theme.spacing(1)` is `NaN`, TypeScript allows it, and emotion drops the rule.
  If the diff touches styles, grep for `-theme.spacing` and check computed styles
  in the browser.

## When to go further

If the change touched rendering, routing, or the save pipeline, compiling is not
enough. Start the dev server, load a save (`loadMockSave()` in the console, or a
real `.sav` through the file input), and check the browser console for errors
before calling it verified.

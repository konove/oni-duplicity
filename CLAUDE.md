# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A web-based Oxygen Not Included save editor. React 19 + MUI v9 + redux-saga, bundled with webpack 5, deployed to GitHub Pages.

## Commands

Node 22.15+ required (developed on 24 LTS). The floor is set by `webpack-dev-server@6`, the only package in the tree that needs more than 20.19 — below it everything except `npm start` still works, which is a confusing way to fail.

- `npm start` — dev server on :8080
- `npm run build` — production bundle to `dist/`
- `npm test` — jest
- `npm run typecheck` — `tsc -p src` for the app, then `tsc -p tsconfig.node.json` for the build tooling

The application's TypeScript project lives at `src/tsconfig.json`, **not** the repo root, so any `tsc` invocation over app code needs `-p src`. The repo-root `tsconfig.node.json` covers only the build tooling (`webpack.config.js`, `eslint.config.ts`); there is deliberately no root `tsconfig.json`, so a bare `tsc` finds no project.

**On Windows**, this machine's PowerShell execution policy is `AllSigned`, which refuses npm's unsigned `npm.ps1`. Use `npm.cmd` / `npx.cmd` instead — plain `npm` fails with a `PSSecurityException`.

## Styling: `@/styles` is a local shim, not MUI

`makeStyles`, `withStyles`, `createStyles` and `WithStyles` come from **`@/styles`** (`src/styles.tsx`), a local reimplementation on top of emotion. MUI removed these APIs along with `@mui/styles`; the shim exists so ~40 components and 147 `classes.*` call sites didn't need rewriting to `sx`.

- Never import them from `@mui/material/styles` or add `@mui/styles`.
- It supports only what the codebase uses: single-argument `withStyles(styles)(C)` and zero-argument `useStyles()`. Extend the shim rather than working around it.
- Rule objects go to emotion untouched, so nested selectors (`"&::-webkit-inner-spin-button"`, `"&:hover"`) do work. What does not is MUI v4's JSS-only syntax, such as `$ruleName` cross-references.
- `root.tsx` installs an emotion cache with `prepend: true` so MUI's own styles are inserted first and `className={classes.x}` overrides still win. Don't remove it.

New components should prefer `sx`; the shim is for the existing ones.

### `theme.spacing()` returns a string

Since MUI v5 it returns `"8px"`, not `8`. `-theme.spacing(1)` evaluates to `NaN`, TypeScript does not flag it, and emotion silently drops the declaration. Negate through the argument instead:

```ts
marginLeft: theme.spacing(-1); // "-8px"
marginLeft: -theme.spacing(1); // NaN — rule vanishes
```

## Duplicant sprites

Import portrait components from **`@/components/duplicant`**, never from `react-oni-duplicant` directly. That package's barrel pulls in its `DuplicantContainer`, which is built on `react-jss@8` and uses React's legacy context API — removed in React 19. The local module reimplements the container on emotion and re-exports the four sprite leaves via deep paths so react-jss never enters the bundle. Their types live in `src/types/react-oni-duplicant.d.ts` (the package ships `React.SFC`, which no longer exists).

## The save parser

`oni-save-parser` is a **git dependency pinned to a commit** on the fork at `github.com/konove/oni-save-parser`, not the npm release. To change it: edit the fork, `npm run build` there (build output is committed), commit, push, then re-pin the new sha in `package.json`.

The fork ships source maps with the TypeScript inlined (`inlineSources`), which is why `webpack.config.js` runs `source-map-loader` over this one package and no other — a parse failure then resolves to parser source rather than bundled output. Most other dependencies ship no maps, so a blanket rule would only produce warnings.

Supported save versions are the `CURRENT_VERSION_MINOR` array in the fork's `src/save-structure/version-validator.ts`. Saves are self-describing — each file carries its own type templates — so a minor version bump that only adds or reorders fields parses unchanged. Use `/save-version` to verify a new version before adding it; never add one unverified.

## Testing

**Every change ships with a test.** New feature, bug fix, or refactor of existing
behaviour — add or update the test that would have caught it. Match the test to what
changed:

| What changed                                                                                                      | Test to write                                                                       | Where                |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------- |
| Reducers, selectors, domain modules, anything pure                                                                | `*.spec.ts`, node environment                                                       | beside the code      |
| A component's props, handlers, or semantics (an element becoming a `<button>`, an `aria-label`, a commit-on-blur) | `*.spec.tsx` with a `@jest-environment jsdom` docblock and `@testing-library/react` | beside the component |
| Anything you can see — layout, spacing, a control's appearance, a focus ring                                      | Playwright screenshot                                                               | `e2e/`               |

Commands: `npm test` (jest), `npm run test:e2e` (Playwright), `npm run test:e2e:update`
to accept new screenshots.

### Rules that are not optional

**Prove the test can fail.** Write it, then break the thing it covers and watch it go
red, then restore. Every trap below was found this way, and each one produced a test
that passed while the feature was deleted.

**Look at the screenshot.** `test:e2e:update` rewrites baselines without asking. A diff
is either a regression or an intended change, and only opening the image tells you
which. Playwright writes `-actual`, `-expected` and `-diff` PNGs into `test-results/`
on failure.

### Screenshot tests

`e2e/` drives the **dev server**, because `loadMockSave()` (`src/debug.ts`) exists only
in dev builds — without it every page past the overview redirects away and there is
nothing to photograph. `e2e/fixtures.ts` wraps that; `playwright.config.ts` starts the
server itself.

Baselines live in `e2e/__screenshots__/` and are committed. They are **platform
specific** — Chromium renders text differently on Windows and Linux, so a baseline
taken here will not match one taken elsewhere. Playwright puts the platform in the
filename, which keeps that visible rather than mysterious.

Traps, all of which produced a green-but-meaningless test at some point:

- **jsdom cannot screenshot.** It has no layout or paint engine. Pixel comparison needs
  a real browser; that is why Playwright is here and not just jest.
- **Ratio tolerances hide real regressions.** `maxDiffPixelRatio: 0.01` sounds tight and
  allows 11,520 changed pixels on a 1280×900 page — enough to move a control or reflow a
  table. The config uses an absolute `maxDiffPixels: 50`; same-machine reruns are
  deterministic, so anything larger is a real change.
- **Element screenshots clip to the element's box.** A focus ring drawn with
  `outlineOffset` paints _outside_ that box and is cropped away, giving a shot identical
  to the unfocused one. Screenshot a padded region of the page instead (see the focus
  test in `e2e/duplicant-editor.spec.ts`).
- **`.focus()` does not trigger `:focus-visible`.** MUI applies `focusVisibleClassName`
  only on keyboard focus, so a programmatic `.focus()` never shows the ring and the test
  passes with the ring deleted. Press `Tab` to reach the control.
- **Confirm your fake regression is actually visible before blaming the harness.** MUI's
  `Table` sets `border-collapse: collapse`, and CSS ignores padding on a collapsed-border
  table — a "padding" regression applied cleanly, rendered identically, and looked like a
  broken test for half an hour.

### Jest specifics

Tests are `*.spec.ts` files sitting **next to the code they test** (e.g.
`src/services/oni-save/reducer/modify-behavior.spec.ts`), not in `__tests__/` directories.
A glob for `*.test.ts` finds nothing and will make you think the repo is untested.
`src/__mocks__/` holds fixture data, not jest module mocks.

The default `testEnvironment` is **`node`** — the logic suites need no DOM and start
faster without one. A component test opts in per file with a `@jest-environment jsdom`
docblock. `test/setup-dom.js` registers `@testing-library/jest-dom`'s matchers, guarded
on `document` existing so the node suites are unaffected.

CSS and asset imports are mapped to stubs in `test/` so a component can be imported at
all. Those mappings must stay **above** the `^@/(.*)$` alias in `moduleNameMapper` — jest
applies mappers in order, and `@/style.css` would otherwise resolve to the real file and
be parsed as JavaScript.

The stubs do not make the duplicant sprite components unit-testable.
`react-oni-duplicant` ships untranspiled ESM (jest skips `node_modules` transforms) and
reaches for `require.context`, which only webpack provides. Those components are covered
by the Playwright screenshots instead, which run the real bundle.

## Gotchas

- **Hash routing.** URLs are `/#/duplicants`, and `HashRouter` lives in `root.tsx`. Routing state is not in redux — `connected-react-router` was removed and nothing selects off a router slice.
- **`loadMockSave()`** is exposed on `window` in dev builds (`src/debug.ts`) and loads `src/__mocks__/save-game.json`. Use it to exercise the editor without a real `.sav`.
- **The service worker is production-only.** `GenerateSW` warns on every rebuild under `--watch` and webpack-dev-server renders warnings as a full-screen overlay, so it is gated behind `!isDev`. The Settings page's offline-mode toggle therefore cannot be tested via `npm start` (nothing serves `/service-worker.js`) — build and serve `dist/`.
- **`webpack.config.js` is type-checked, but stays CommonJS JavaScript.** It opens with `// @ts-check` and types its export with `/** @type {import("webpack").Configuration} */`, which `tsconfig.node.json` enforces under `npm run typecheck`. That annotation must sit on a `const config`, not on `module.exports` directly — TypeScript ignores `@type` on a CommonJS export assignment and silently checks nothing. Keeping the file `.js` avoids making webpack-cli load a `.ts` config, which needs a loader (`tsx`/`ts-node`) or Node's native type stripping, and the two disagree about `__dirname`.
- **The save-serializer runs in a web worker** via webpack 5's native `new Worker(new URL(...))`. `worker-loader` is gone.
- **Prettier is enforced by hand, not by a hook.** `npm run format` writes, `npm run format:check` verifies; there is no CI and no pre-commit hook, so nothing runs it for you. `.prettierrc` sets only `endOfLine: "auto"` — the working tree is CRLF on Windows, and prettier's `lf` default would otherwise rewrite every file. The one-time reformat commit is listed in `.git-blame-ignore-revs`.

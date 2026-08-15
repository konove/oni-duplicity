# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A web-based Oxygen Not Included save editor. React 19 + MUI v9 + redux-saga, bundled with webpack 5, deployed to GitHub Pages.

## Commands

Node 20.19+ required (developed on 24 LTS).

- `npm start` — dev server on :8080
- `npm run build` — production bundle to `dist/`
- `npm test` — jest
- `npm run typecheck` — `tsc -p src --noEmit`

The TypeScript project lives at `src/tsconfig.json`, **not** the repo root. Any `tsc` invocation needs `-p src`.

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

Supported save versions are the `CURRENT_VERSION_MINOR` array in the fork's `src/save-structure/version-validator.ts`. Saves are self-describing — each file carries its own type templates — so a minor version bump that only adds or reorders fields parses unchanged. Use `/save-version` to verify a new version before adding it; never add one unverified.

## Testing

Tests are `*.spec.ts` files sitting **next to the code they test** (e.g. `src/services/oni-save/reducer/modify-behavior.spec.ts`), not in `__tests__/` directories. A glob for `*.test.ts` finds nothing and will make you think the repo is untested. `src/__mocks__/` holds fixture data, not jest module mocks.

## Gotchas

- **Hash routing.** URLs are `/#/duplicants`, and `HashRouter` lives in `root.tsx`. Routing state is not in redux — `connected-react-router` was removed and nothing selects off a router slice.
- **`loadMockSave()`** is exposed on `window` in dev builds (`src/debug.ts`) and loads `src/__mocks__/save-game.json`. Use it to exercise the editor without a real `.sav`.
- **The service worker is production-only.** `GenerateSW` warns on every rebuild under `--watch` and webpack-dev-server renders warnings as a full-screen overlay, so it is gated behind `!isDev`. The Settings page's offline-mode toggle therefore cannot be tested via `npm start` — build and serve `dist/`.
- **The save-serializer runs in a web worker** via webpack 5's native `new Worker(new URL(...))`. `worker-loader` is gone.
- Prettier is a devDependency with no config file, so it formats on defaults.

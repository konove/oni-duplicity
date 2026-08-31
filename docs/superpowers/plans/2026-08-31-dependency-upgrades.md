# Dependency Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `oni-duplicity` and its pinned `oni-save-parser` fork up to current dependency versions, without shipping a save file the game refuses to load.

**Architecture:** Two phases against two repositories. Phase A upgrades the app, which has 318 jest tests and 36 screenshots and can therefore be verified mechanically. Phase B upgrades the parser fork, which has **zero tests** and does the binary reading and writing — so it gets a safety net built first, in the app, before a single version moves. Phase A ships on its own; Phase B is optional and strictly later, because it ends with re-pinning the parser sha in the app.

**Tech Stack:** npm, TypeScript, jest + ts-jest, Playwright (in Docker), webpack 5, React 19, MUI 9.

**Spec:** This document. The requirement was "upgrade all packages to latest version for both repos"; the research that shaped it is recorded in the Findings section below, and two of those findings change the answer from "yes, all of them".

---

## Findings that shape this plan

Established by inspection on 2026-08-31, not assumed:

1. **TypeScript 7 is blocked in the app.** `ts-jest@latest` declares peer `typescript >=4.3 <7`; `typescript-eslint@latest` declares `>=4.8.4 <6.1.0`. The app runs TS 6.0.3, which satisfies both. Moving to 7.0.2 breaks the test runner and the linter. TypeScript stays at 6 until both publish support. This is the one place where "all packages to latest" cannot be honoured.
2. **Only two app packages are a major behind**: `react-router` 7.18.2 → 8.3.1, and `typescript` 6.0.3 → 7.0.2 (blocked, above). The other fifteen are minors or patches inside their current major.
3. **The parser has no tests at all.** Zero `*.spec.ts` files, no `test` script.
4. **Nothing in either repo parses a real `.sav`.** The app's fixture, `src/__mocks__/save-game.json`, is already-parsed JSON. The two specs mentioning `ArrayBuffer` construct 4- and 8-byte state-machine blobs. The binary reader, the binary writer and the zlib layer are exercised by nothing.
5. **`long` is a declared dependency of the parser that is never imported.** Dead weight.
6. **`text-encoding` is deprecated and unmaintained.** The parser uses it in three files purely for `TextEncoder`/`TextDecoder`, which have been global in Node since 11 and in every browser the app supports.
7. **No `.sav` file exists in either working tree.** Phase B needs one, and Task 4 is where that is resolved.
8. **`@playwright/test` is already current** (1.62.1). Deliberately left alone: the Docker image tag in `docker-compose.yml` is pinned to it, and bumping it means a new Chromium and regenerating all 23 baselines. That is its own change, not part of this one.

## Global Constraints

- Node floor is `>=22.15.0` (`package.json` engines). Developed on 24.
- On Windows use `npm.cmd` / `npx.cmd`; PowerShell execution policy is `AllSigned` and refuses npm's unsigned `npm.ps1`.
- `npm run test:e2e` is `docker compose run --rm -T e2e` and requires Docker Desktop running. It is the only supported way to run the screenshots.
- Every change ships with a test (CLAUDE.md). For dependency bumps the existing suite is that test; where it cannot be, the plan says so explicitly and adds one.
- Do not bump `@playwright/test` in this work. See Finding 8.
- The app's TypeScript project is `src/tsconfig.json`; any `tsc` over app code needs `-p src`.
- Full verification command set, in order: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`.
- Commit messages follow the repo's existing voice: a sentence-case subject saying what changed, and a body saying why. End with the `Co-Authored-By` and `Claude-Session` trailers used by recent commits.

---

# Phase A — oni-duplicity

Repository: `F:\Projects\oni-duplicity`. Ships independently of Phase B.

### Task 1: The fifteen in-major upgrades

**Files:**

- Modify: `package.json` (dependency ranges)
- Modify: `package-lock.json` (generated)

**Interfaces:**

- Consumes: nothing
- Produces: a tree on current minors, which Task 2 upgrades react-router against

These are all `Wanted == Latest` inside the current major: `@mui/material`, `@mui/icons-material` 9.3.1→9.4.0; `@mui/x-tree-view` 9.11.0→9.12.0; `@testing-library/react` 16.3.2→16.3.3; `@types/react-dom` 19.2.4→19.2.5; `css-loader` 7.1.4→7.1.5; `eslint` 10.8.1→10.9.1; `i18next` 26.3.6→26.4.0; `jest` and `jest-environment-jsdom` 30.4.x→30.5.0; `react-i18next` 17.0.11→17.0.12; `reselect` 5.2.0→5.3.0; `typescript-eslint` 8.67.0→8.68.0; `webpack` 5.109.2→5.110.2; `webpack-cli` 7.2.2→7.2.3; and `react-router` 7.18.2→7.18.3 (staying on 7).

- [ ] **Step 1: Record the baseline so a regression is attributable**

```bash
cd /f/Projects/oni-duplicity
npm.cmd test 2>&1 | tail -3          # expect: 34 suites, 318 tests, all passing
git status --short                    # expect: clean
```

- [ ] **Step 2: Apply the in-major upgrades**

```bash
npm.cmd update --save
```

`npm update` will not cross a major boundary, which is exactly why it is the right tool here: `react-router` moves to 7.18.3 and stops, and `typescript` does not move at all.

- [ ] **Step 3: Confirm it crossed no majors**

```bash
git diff package.json
```

Expected: every changed range keeps its leading major. If `react-router` shows `^8` or `typescript` shows `^7`, stop and revert — `npm update` was given the wrong flags.

- [ ] **Step 4: Run the full suite**

```bash
npm.cmd run format:check && npm.cmd run lint && npm.cmd run typecheck && npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

Expected: all green; 318 jest tests; 36 Playwright tests. A screenshot failure here is real — MUI 9.4.0 could move a pixel. If one fails, open `test-results/*-diff.png` and look at it before deciding. If the change is a genuine and acceptable MUI rendering difference, `npm run test:e2e:update` and say so in the commit body; if it is a layout regression, that is a reason not to take the MUI bump.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "Take the current minors"
```

---

### Task 2: react-router 7 → 8

**Files:**

- Modify: `package.json`, `package-lock.json`
- Possibly modify: `src/root.tsx` (`HashRouter`), `src/routes.tsx` (`Routes`, `Route`, `Navigate`), `src/components/ListItemLink.tsx` (`useHref`, `useLocation`, `useNavigate`), `src/pages/OverviewPage/components/SaveOverview/components/Destinations.tsx` (`Link`)
- Test: existing `src/components/Nav.spec.tsx`, `src/pages/.../SaveOverview.spec.tsx` (both render inside `MemoryRouter`)

**Interfaces:**

- Consumes: the tree from Task 1
- Produces: nothing new; the router API surface used by the app is `HashRouter`, `MemoryRouter`, `Routes`, `Route`, `Navigate`, `Link`, `useHref`, `useLocation`, `useNavigate`

- [ ] **Step 1: Read the migration guide before touching anything**

Fetch `https://reactrouter.com/upgrading/v7` (or the v8 upgrade page it links to) and write down, in the commit body you will eventually use, which of the nine APIs above changed. Do not skip this and lean on the type-checker: `connected-react-router` was already removed from this app once, and routing state deliberately does not live in redux, so a v8 change that pushes state handling around has nowhere to go here.

- [ ] **Step 2: Upgrade**

```bash
npm.cmd install react-router@8
```

- [ ] **Step 3: Typecheck to find the breaks**

```bash
npm.cmd run typecheck
```

Expected: either clean, or errors naming the exact call sites. Fix each at its call site; do not add `as any`.

- [ ] **Step 4: Run the suite**

```bash
npm.cmd test && npm.cmd run test:e2e && npm.cmd run build
```

Expected: 318 jest, 36 Playwright. `Nav.spec.tsx` is the sharpest check here — it asserts `aria-disabled` on `ListItemButton component="a"`, which is `ListItemLink` driving `useHref`/`useNavigate`.

- [ ] **Step 5: Exercise hash routing by hand**

```bash
npm.cmd start
```

Open `http://localhost:8080`, then in the console run `loadMockSave()`. Click every sidebar entry and confirm the URL reads `/#/duplicants`, `/#/geysers` and so on, that the back button in the duplicant editor returns to the list, and that reloading on `/#/materials` lands on Materials rather than redirecting to the overview. The screenshots cannot see any of that.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src
git commit -m "Move to react-router 8"
```

---

### Task 3: Record why TypeScript stays on 6

**Files:**

- Modify: `CLAUDE.md` (the Commands section, near the existing `tsc -p src` note)

No code change. The point is that the next person to run `npm outdated` sees `typescript 6.0.3 → 7.0.2` and needs to know it is deliberate rather than missed.

- [ ] **Step 1: Re-check the peer ranges, in case they moved**

```bash
npm.cmd view ts-jest@latest peerDependencies.typescript
npm.cmd view typescript-eslint@latest peerDependencies.typescript
```

Expected as of 2026-08-31: `>=4.3 <7` and `>=4.8.4 <6.1.0`. If both now admit 7, skip this task and do the upgrade instead, following Task 2's shape.

- [ ] **Step 2: Add the note to CLAUDE.md**

Under the Commands section, after the paragraph about `src/tsconfig.json`:

```markdown
**TypeScript is held at 6 on purpose.** `npm outdated` will offer 7. `ts-jest`
declares peer `typescript >=4.3 <7` and `typescript-eslint` declares
`>=4.8.4 <6.1.0`, so taking 7 breaks the test runner and the linter at the same
time. Re-check both peer ranges before trying again.
```

- [ ] **Step 3: Verify formatting and commit**

```bash
npm.cmd run format:check
git add CLAUDE.md
git commit -m "Say why TypeScript is pinned below 7"
```

---

**Phase A ends here and is shippable.** Push, let CI run, merge. Phase B can wait indefinitely.

---

# Phase B — oni-save-parser

Repository: `F:\Projects\oni-save-parser`, currently clean on `master` at `82cf87a`, which is the sha `oni-duplicity` pins.

**Read this before starting.** This repository has no tests, and its job is to turn bytes into a colony and back. The app's suite cannot catch a regression here, because the app's fixture is already-parsed JSON — the binary reader, the binary writer and the zlib layer run in no test anywhere. Task 4 fixes that first. Do not reorder it.

### Task 4: A round-trip test, in the app, before anything moves

**Files:**

- Create: `src/services/oni-save/round-trip.spec.ts` (in **oni-duplicity**)
- Create: `src/__mocks__/save-game.sav` (a real save; see Step 1)

**Interfaces:**

- Consumes: `oni-save-parser`'s public `parseSaveGame` / `writeSaveGame`, both confirmed exports of `F:\Projects\oni-save-parser\src\index.ts`
- Produces: the only automated check that the parser reads and writes bytes correctly. Every later task in this phase is verified by running it.

- [ ] **Step 1: Get a real save and decide where it lives**

Take the smallest real `.sav` available — a freshly generated colony at cycle 1 is a few hundred KB, far smaller than a mature one. Copy it to `src/__mocks__/save-game.sav`.

Then decide, and say which in the commit: either commit it (the repo already carries a 1.3 MB `save-game.json`, so a small `.sav` is not a new kind of cost, and committing it means CI runs this test), or add it to `.gitignore` and keep it local (in which case the test must skip when absent, and CI gains nothing). Committing is strongly preferred — an uncommitted fixture protects only the machine it sits on, which is the machine least likely to be surprised.

- [ ] **Step 2: Note the prior art before writing anything**

`parseSaveGame` and `writeSaveGame` are confirmed exports of `src/index.ts` in the parser — the test below uses them as written, no substitution needed.

More usefully, `src/test/index.ts` in the parser is **already a round-trip harness**: it loads a save, writes it back, reloads it and diffs the two with `deep-diff`. It is a CLI tool wired to no npm script, so it runs only when someone remembers it, and it is why `deep-diff`, `minimist` and `lodash.flowright` are devDependencies. Read it first — the shape below is the same idea, moved into the app's jest suite so it runs on every commit instead of on request.

```bash
sed -n '1,60p' /f/Projects/oni-save-parser/src/test/index.ts
```

- [ ] **Step 3: Write the failing test**

`src/services/oni-save/round-trip.spec.ts`:

```ts
import * as fs from "fs";
import * as path from "path";

import { parseSaveGame, writeSaveGame } from "oni-save-parser";

// The bundled save-game.json is already-parsed JSON, so nothing in either
// repository exercises the binary reader, the binary writer or the zlib layer.
// This does: real bytes in, a parse, a write, and a second parse that has to
// agree with the first. It is the safety net the parser's dependency upgrades
// are checked against.
const FIXTURE = path.join(__dirname, "../../__mocks__/save-game.sav");

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

it("reads a real save, writes it back, and reads the same thing again", () => {
  const original = toArrayBuffer(fs.readFileSync(FIXTURE));

  const first = parseSaveGame(original);
  const rewritten = writeSaveGame(first);
  const second = parseSaveGame(rewritten);

  expect(second.header.gameInfo).toEqual(first.header.gameInfo);
  expect(second.gameObjects.map((g) => g.name)).toEqual(
    first.gameObjects.map((g) => g.name),
  );
  expect(second.gameObjects.map((g) => g.gameObjects.length)).toEqual(
    first.gameObjects.map((g) => g.gameObjects.length),
  );
});
```

- [ ] **Step 4: Run it and watch it pass**

```bash
npm.cmd test -- round-trip
```

Expected: **PASS**. This is the one test in this plan that is not expected to fail first — it describes behaviour that already works, and its whole purpose is to notice when a dependency upgrade breaks it. To prove it can fail, temporarily change `expect(second.header.gameInfo)` to compare against `{}` and confirm it goes red, then restore.

- [ ] **Step 5: Prove it catches a real parser break**

```bash
# In the parser checkout, temporarily corrupt the zlib layer:
#   src/binary-serializer/data-writer/zlib-writer.ts
#   change `deflate(...)` to `deflate(..., { level: 1 })`
# then rebuild and re-pin, or point the app at the local checkout with:
#   npm.cmd install /f/Projects/oni-save-parser
npm.cmd test -- round-trip
```

Expected: still passes (compression level does not change the decoded content) — which tells you the test checks meaning, not bytes. If you want byte-level cover as well, add a second assertion comparing `rewritten.byteLength` to `original.byteLength` and accept that it is stricter than the game requires. Restore the parser afterwards either way.

- [ ] **Step 6: Commit, in oni-duplicity**

```bash
git add src/services/oni-save/round-trip.spec.ts src/__mocks__/save-game.sav
git commit -m "Put a real save through the parser and back"
```

---

### Task 5: Delete the dependency that is never imported

**Files:**

- Modify: `package.json` in **oni-save-parser**

`long@^4.0.0` is declared and imported nowhere. Verified with `grep -rn "long" src --include=*.ts | grep -i import`, which returns nothing.

- [ ] **Step 1: Confirm it is still unused**

```bash
cd /f/Projects/oni-save-parser
grep -rn "from \"long\"\|require(\"long\")" src/ ; echo "exit=$?"
```

Expected: no output. If anything prints, stop — this task is void.

- [ ] **Step 2: Remove it**

```bash
npm.cmd uninstall long @types/long
```

- [ ] **Step 3: Build**

```bash
npm.cmd run build
```

Expected: clean. `long` was never imported, so nothing can reference it.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "Drop long, which nothing imports"
```

---

### Task 6: Replace text-encoding with the platform's own

**Files:**

- Modify: `src/binary-serializer/data-reader/array-reader.ts:1` (in **oni-save-parser**)
- Modify: `src/binary-serializer/data-writer/array-writer.ts:1`
- Modify: `src/save-structure/header/parser.ts:1`
- Modify: `package.json`

`text-encoding@0.6.4` is deprecated ("no longer maintained") and is one of the npm warnings in the app's CI log. `TextEncoder` and `TextDecoder` have been globals in Node since 11 and in every browser this app targets, so the package is a polyfill for nothing.

- [ ] **Step 1: See the three imports**

```bash
cd /f/Projects/oni-save-parser
grep -rn "text-encoding" src/
```

Expected exactly:

```
src/binary-serializer/data-reader/array-reader.ts:1:import { TextDecoder } from "text-encoding";
src/binary-serializer/data-writer/array-writer.ts:1:import { TextEncoder } from "text-encoding";
src/save-structure/header/parser.ts:1:import { TextDecoder, TextEncoder } from "text-encoding";
```

- [ ] **Step 2: Delete those three import lines**

They are the first line of each file. Removing them leaves the identifiers resolving to the global `TextEncoder`/`TextDecoder`, which is the entire change.

- [ ] **Step 3: Build**

```bash
npm.cmd run build
```

If `tsc` reports `Cannot find name 'TextDecoder'`, the DOM and Node lib types are not in scope. Add `"lib": ["es2017", "dom"]` to `src/tsconfig.json` alongside the existing `"target": "es6"` — the file currently sets no `lib`, so it defaults from `target` and gets no DOM.

- [ ] **Step 4: Remove the package**

```bash
npm.cmd uninstall text-encoding @types/text-encoding
npm.cmd run build
```

- [ ] **Step 5: Verify through the app's round-trip test**

```bash
cd /f/Projects/oni-duplicity
npm.cmd install /f/Projects/oni-save-parser
npm.cmd test -- round-trip
```

Expected: PASS. This is the first task where the safety net earns its keep — string decoding is exactly what `text-encoding` was doing, and every game object name in the save goes through it.

- [ ] **Step 6: Commit in the parser, then restore the app's pin**

```bash
cd /f/Projects/oni-save-parser
git add -A && git commit -m "Use the platform's TextEncoder instead of a dead polyfill"
cd /f/Projects/oni-duplicity
git checkout package.json package-lock.json   # undo the local-path install
```

Re-pinning for real happens once, in Task 10.

---

### Task 7: The safe parser bumps

**Files:**

- Modify: `package.json`, `package-lock.json` in **oni-save-parser**

`@types/lodash.flowright` 3.5.3→3.5.9, `@types/minimist` 1.2.0→1.2.5, `deep-diff` 1.0.1→1.0.2, `jsonschema` 1.2.4→1.5.0, `minimist` 1.2.0→1.2.8. All in-major.

- [ ] **Step 1: Upgrade**

```bash
cd /f/Projects/oni-save-parser
npm.cmd update --save
```

- [ ] **Step 2: Take `@types/deep-diff` explicitly**

```bash
npm.cmd install --save-dev @types/deep-diff@1
```

`npm update` will not move it: its range is the exact version `0.0.31`, so Wanted equals Current and it is skipped. It types the `diff()` call in `src/test/index.ts`, which is the manual round-trip harness — the only consumer.

- [ ] **Step 3: Build**

```bash
npm.cmd run build
```

Expected: clean. `jsonschema` is the one with real surface — it validates the save header in `src/save-structure/header/parser.ts`.

- [ ] **Step 4: Verify through the round-trip test**

```bash
cd /f/Projects/oni-duplicity && npm.cmd install /f/Projects/oni-save-parser && npm.cmd test -- round-trip
```

Expected: PASS. A `jsonschema` regression shows up here as a header validation failure.

- [ ] **Step 5: Commit in the parser and restore the app's pin**

```bash
cd /f/Projects/oni-save-parser
git add package.json package-lock.json && git commit -m "Take the in-major dependency updates"
cd /f/Projects/oni-duplicity && git checkout package.json package-lock.json
```

---

### Task 8: pako 1 → 3

**Files:**

- Modify: `src/binary-serializer/data-reader/zlib-reader.ts:1` (in **oni-save-parser**)
- Modify: `src/binary-serializer/data-writer/zlib-writer.ts:1`
- Modify: `package.json`

pako is the compression layer for the whole save body. This is the single highest-risk upgrade in the plan: a subtle change here produces a file that parses here and is rejected by the game.

- [ ] **Step 1: Read what changed**

Fetch `https://github.com/nodeca/pako/blob/master/CHANGELOG.md` and read the 2.0.0 and 3.0.0 entries. Note in particular whether `inflate`'s default return type changed between `Uint8Array` and `string`, since `zlib-reader.ts` feeds the result straight into the binary reader.

- [ ] **Step 2: Upgrade**

```bash
cd /f/Projects/oni-save-parser
npm.cmd install pako@3 @types/pako@2
npm.cmd run build
```

- [ ] **Step 3: Fix whatever the build reports**

The current imports are `import { inflate } from "pako";` and `import { deflate } from "pako";`. If pako 3 no longer offers those as named CommonJS exports, switch to `import pako from "pako";` and call `pako.inflate` / `pako.deflate`; `esModuleInterop` is already on in `src/tsconfig.json`.

- [ ] **Step 4: Verify through the round-trip test**

```bash
cd /f/Projects/oni-duplicity && npm.cmd install /f/Projects/oni-save-parser && npm.cmd test -- round-trip
```

Expected: PASS. If this fails, the compression layer is wrong and the upgrade must not proceed — revert pako and stop.

- [ ] **Step 5: Verify in the game, before committing**

This is not optional and no test replaces it. Run the app, load a real colony, change one duplicant's name, save, move the resulting `.sav` into `save_files`, and load it in Oxygen Not Included. A save that parses cleanly here and crashes the game is exactly the failure mode this repository's README warns about.

- [ ] **Step 6: Commit in the parser and restore the app's pin**

```bash
cd /f/Projects/oni-save-parser
git add -A && git commit -m "Move to pako 3"
cd /f/Projects/oni-duplicity && git checkout package.json package-lock.json
```

---

### Task 9: The toolchain — prettier, rimraf, TypeScript, @types/node

**Files:**

- Modify: `package.json`, `package-lock.json` in **oni-save-parser**
- Modify: `src/tsconfig.json` if the compiler demands it
- Modify: every `.ts` file under `src/` (the prettier reformat only)
- Create: `.git-blame-ignore-revs` in the parser, if the reformat is taken

These are build-time only: nothing here ships in the parser's output. That makes them lower risk than Task 8 and is why they come last.

- [ ] **Step 1: prettier 1 → 3, as its own commit**

```bash
cd /f/Projects/oni-save-parser
npm.cmd install --save-dev prettier@3
npm.cmd run format
npm.cmd run build          # must still be clean; formatting changes no semantics
git add -A && git commit -m "Format with prettier 3"
git rev-parse HEAD >> .git-blame-ignore-revs
git add .git-blame-ignore-revs && git commit -m "Skip the reformat in blame"
```

The app does exactly this — see its `.git-blame-ignore-revs` and the "one-time reformat commit" note in CLAUDE.md.

- [ ] **Step 2: rimraf 2 → 6**

```bash
npm.cmd install --save-dev rimraf@6
npm.cmd run clean        # the "clean" script is `rimraf lib dts`
```

rimraf 4 changed its CLI. If `npm run clean` now errors, the fix is in `package.json`'s `clean` script, not in the dependency. Confirm `lib/` and `dts/` are actually gone afterwards, then `npm.cmd run build` to put them back.

- [ ] **Step 3: TypeScript 3.9 → 5, in one hop, and see what breaks**

```bash
npm.cmd install --save-dev typescript@5 @types/node@22
npm.cmd run build
```

Four majors is a lot to cross blind, which is why this stops at 5 rather than 7: `@types/node@26` and TS 7 can follow once 5 is clean. Expected breaks are `strict`-mode tightenings — TS 4.0's variadic tuples, 4.4's `unknown` catch variables, 5.0's stricter enum handling. Fix each at the site; do not loosen `strict` in `src/tsconfig.json`.

- [ ] **Step 4: Verify through the round-trip test after each compiler bump**

```bash
cd /f/Projects/oni-duplicity && npm.cmd install /f/Projects/oni-save-parser && npm.cmd test -- round-trip
```

Expected: PASS. A compiler upgrade that changes emitted output is a real possibility across four majors — `target: es6` is unchanged, but downlevel emit details are not guaranteed stable.

- [ ] **Step 5: Then 5 → 7, only if step 4 was clean**

```bash
cd /f/Projects/oni-save-parser
npm.cmd install --save-dev typescript@7 @types/node@26
npm.cmd run build
```

Unlike the app, the parser has no ts-jest or typescript-eslint, so nothing here blocks TypeScript 7. If the build fights, stopping at 5 is a perfectly good outcome — record it in the commit body and move on.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "Bring the parser's build toolchain forward"
```

---

### Task 10: Re-pin the parser in the app

**Files:**

- Modify: `package.json`, `package-lock.json` in **oni-duplicity**

CLAUDE.md's procedure: edit the fork, build it, commit (build output is committed), push, then re-pin the new sha.

- [ ] **Step 1: Confirm the parser's build output is committed and pushed**

```bash
cd /f/Projects/oni-save-parser
npm.cmd run build
git status --short          # expect: clean, including lib/ and dts/
git push origin master
git log --oneline -1        # note the sha
```

If `lib/` or `dts/` show as modified, the last commit did not include a rebuild. Commit them — the app installs this package straight from git and never builds it.

- [ ] **Step 2: Re-pin**

```bash
cd /f/Projects/oni-duplicity
npm.cmd install "github:konove/oni-save-parser#<the sha from step 1>"
git diff package.json        # expect only the oni-save-parser line to move
```

- [ ] **Step 3: Full verification**

```bash
npm.cmd run format:check && npm.cmd run lint && npm.cmd run typecheck && npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

Expected: 318 jest tests plus the round-trip from Task 4, 36 Playwright tests, clean build.

- [ ] **Step 4: Verify in the game one final time**

Load a real colony, make an edit, save, move the file into `save_files`, load it in Oxygen Not Included. The whole phase changed the code that writes that file.

- [ ] **Step 5: Commit and push**

```bash
git add package.json package-lock.json
git commit -m "Re-pin the parser after its dependency upgrades"
git push origin master
```

---

## Deliberately not done

- **TypeScript 7 in the app.** Blocked by `ts-jest` (`<7`) and `typescript-eslint` (`<6.1.0`). Task 3 records this so it is not re-discovered.
- **`@playwright/test`.** Already current, and bumping it regenerates every baseline and moves the Docker image tag. Its own change.
- **The remaining npm deprecation warnings** — `glob`, `inflight`, `whatwg-encoding` — come from `ts-jest` and other transitive parents. They resolve when those publish, not here. `npm ci` reports 0 vulnerabilities.
- **`npm warn allow-scripts`** for `jss` (via `react-oni-duplicant`) and `unrs-resolver`. Silencing it means an `allowScripts` policy in `package.json`, which is a supply-chain decision rather than an upgrade.

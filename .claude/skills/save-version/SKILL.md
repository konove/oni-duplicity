---
name: save-version
description: Verify whether an Oxygen Not Included save version is safe for the parser to accept, by round-tripping real .sav files and deep-comparing the result. Use when a save fails to load with "version is not compatible", when the game updates its save format, or before adding a minor version to CURRENT_VERSION_MINOR.
disable-model-invocation: true
---

Verify a save version and, if it is safe, widen the parser's accepted list.

`$ARGUMENTS` may be a path to a `.sav` file or a directory of them. If empty, scan
`~/Documents/Klei/OxygenNotIncluded` (Windows) or
`~/Library/Application Support/unity.Klei.Oxygen Not Included` (macOS) recursively.

## Why this works

ONI saves are self-describing: every file embeds its own type templates (field
names and types), which `template-parser.ts` reads out of the file. A minor
version bump that only adds, removes or reorders fields therefore parses with no
library change at all. `CURRENT_VERSION_MINOR` is a conservative guard, not a
structural requirement — which is why it is an array.

What would genuinely break: a change to the container format (header layout,
compression, the world/settings/gamedata section order) or a new primitive type
code in the template system. Those surface as a throw inside `parseTemplates` /
`parseTypeInfo`, not as a field mismatch.

## Procedure

1. Locate the parser. It is a git dependency pinned to a fork; the working copy
   is expected at `F:/Projects/oni-save-parser`. Confirm with
   `git -C <path> remote -v`. If it is missing, ask before cloning.

2. Write a probe script in the scratchpad that, for each save:
   - reads the file into an `ArrayBuffer`
   - `parseSaveGame(ab, { versionStrictness: "none" })`
   - `writeSaveGame(save)`
   - re-parses the written output
   - **deep-compares the two parsed results**, recursing into objects and arrays
     and comparing typed arrays and `ArrayBuffer`s byte by byte

   Counting objects or comparing headers is **not** sufficient — the point is to
   prove the raw sim and world buffers survive. Allow ~1e-6 relative drift on
   numbers (float32 storage); require exact equality everywhere else.

   Node has removed `util.isObject`. Older builds of the parser call it, so
   polyfill it at the top of the probe before requiring the library:
   `require("util").isObject ??= (a) => typeof a === "object" && a !== null;`

3. Run it. Large saves need `node --max-old-space-size=6144`, and a full library
   of saves can take several minutes — run it in the background rather than
   blocking.

4. Report per file: version, build, DLC, template count, object count, and
   whether the round trip was clean.

## Deciding

- **Every save of version X round-trips clean** → X is safe. Add it to
  `CURRENT_VERSION_MINOR` in `src/save-structure/version-validator.ts` in the
  fork, keeping the list sorted, then `npm run build` (build output is
  committed), update `CHANGELOG.md`, and commit.
- **Any mismatch, or a throw** → do not add it. Report exactly where it failed;
  that is a real format change needing parser work.

Say plainly which versions you tested and how many files backed each verdict. A
version verified by one small save is weaker evidence than one backed by dozens.

## After changing the fork

The app pins a specific commit. Once the fork is committed **and pushed**,
re-pin `@konove/oni-save-parser` in `package.json` to the new sha, reinstall, and verify
with `npm run typecheck`, `npm test`, `npm run build`. Pushing is the user's
call — ask.

## Caveat to state every time

A clean round trip proves the parser reads and rewrites the container faithfully.
It does **not** prove Oxygen Not Included itself will accept the rewritten file —
that needs the game. Always tell the user to back up before saving over a colony
they care about.

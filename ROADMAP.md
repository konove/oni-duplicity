# Roadmap

What is worth building next, and why. Issue numbers refer to the **upstream tracker**
([RoboPhred/oni-duplicity](https://github.com/RoboPhred/oni-duplicity/issues)), which is where the
project's request history lives.

Releases 3.20–3.27 were a correctness campaign: the right trait list, the right skills, the right
effects, real names instead of raw ids, DLC awareness. The editors that exist are now accurate. This
document is about what comes after that.

Three sources of evidence were used, and they agree more than expected:

1. **What users actually asked for** — ~145 upstream issues. Several requests recur across years, which
   is the strongest demand signal available.
2. **What the save format exposes that the UI never touches** — an audit of the pinned
   `oni-save-parser` fork against `src/`. Several of the most-requested features turn out to be fully
   modelled by the parser with _zero_ UI, which makes them small rather than speculative.
3. **What is broken rather than missing** — some "missing features" are implemented but faulty. Cheaper
   to fix than to build, and it restores trust faster.

Three conclusions shape the ordering:

- **The loudest asks are mostly already built.** "Revive dead duplicants" (3 issues) needs a `<Select>`
  bound to a behavior the parser already types. "Sandbox mode" (3 issues) ships today — users cannot
  find it because the panel prints `SandboxMode` / `Enabled` as raw identifiers.
- **This is a trust problem more than a capability problem.** No undo, no unsaved-changes guard, no
  backup, under a README that opens by telling you to back up your save. Every feature that mutates more
  state at once makes that worse unless the safety net lands alongside it.
- **Two shipped features report wrong numbers.** Users who hit those don't file a feature request.

---

## Tier 0 — Bugs that read as missing features

Ship first. All small, and each is something a user believes is missing or broken.

### 0.1 "Delete all loose materials" deletes only Aerogel

`src/services/oni-save/reducer/delete-looe-material.ts` uses `indexOf` as a boolean predicate:

```ts
function shouldRemoveMaterial(group: GameObjectGroup) {
  return materialsToRemove.indexOf(group.name as SimHashName); // returns a number
}
gameObjects: state.saveGame.gameObjects.filter(shouldRemoveMaterial);
```

`filter` keeps truthy values. `-1` (not a material) → kept, correct by accident. `0` (first match) →
removed. Any index ≥ 1 → **kept**. So "delete all" removes exactly `SimHashNames[0]`, which is
`Aerogel`, and nothing else. Deleting a single named type works only because that type is then at
index 0. Three defects in one file:

- the predicate is inverted and returns a number (a _keep_ predicate named `shouldRemove`)
- it bypasses `tryModifySaveGame`, so **`isModified` is never set**
- the filename is misspelled (`looe`), and imported that way in `reducer/index.ts`

**Effort: S.** Add `delete-loose-material.spec.ts` beside the existing specs. **Sequence this first** —
every later feature that depends on `isModified` (the unsaved-changes guard, then undo) will silently
lie until it is fixed.

### 0.2 Materials page reports mass off by 1000× — #102, #130

`selectors/material.ts` accumulates `PrimaryElement.templateData.Units` into `looseGrams`/`storedGrams`;
`MaterialsTable.tsx#formatWeight` then treats `< 1000` as grams. ONI stores element mass in
**kilograms**, so a 400 kg ore pile renders as "400 g". Fix in the selector (rename to
`looseMass`/`storedMass` — one consumer) and rewrite `formatWeight` for kg input: `< 1` → g, `< 1000` →
kg, else tonnes. Needs one new i18n leaf (`material.tonne`) across all six locales.

**Effort: S. Risk:** confirm the unit against a save with a known-mass storage bin before changing the
divisor — do not take the issue's word or this document's.

### 0.3 The sandbox toggle exists and is unreadable — #115, #99, #60

The write path is already complete and correct: `reducer/modify-difficulty.ts` sets
`CurrentQualityLevelsBySetting` _and_ mirrors `SandboxMode` onto `header.gameInfo.sandboxEnabled`. But
`SaveOverview/components/Difficulty.tsx` renders raw enum keys, so the thrice-requested sandbox switch is
labelled `SandboxMode` with options `Enabled`/`Disabled`, sitting in a grid next to `CalorieBurn`.

**This is a labelling problem only.** Add `src/services/oni-save/difficulty.ts` on the `worlds.ts`
template, mapping each setting and value to a catalogue key, resolved with the
`t("oni:...", { defaultValue: name })` idiom already used in `MaterialsTable.tsx`. Then lift Sandbox out
of the grid into its own labelled switch. **Effort: S–M.**

### 0.4 Health tab section headers are untranslatable

`Health.tsx` uses bare `<Trans>Fitness</Trans>`, `<Trans>Mind</Trans>`, `<Trans>Disease</Trans>` with no
`i18nKey`, so five of six locales show English. **Effort: XS** — fold into 0.3's translation pass.

### 0.5 Import failures are silent

`saga/import-behaviors.ts` has a `TODO: show dialog`; errors reach `console.error` only, so a bad import
looks like nothing happening. `ImportWarningDialog` already exists for the checksum case. **Effort: S.**

### 0.6 Geysers page shows raw enum names

Raw `GeyserType` keys in the dropdown and heading; sliders are uncontrolled (`defaultValue`) with no
numeric readout; `iterationLengthRoll` has no control at all. See also #137 (a missing geyser type).
Same class of defect as 0.3 — bundle with it. **Effort: S–M.**

---

## Tier 1 — Cheap wins, mostly already built

### 1.1 Revive dead duplicants — the highest demand-to-effort ratio here (#91, #67, #45)

`HealthBehavior` ("Health") carries `State: HealthState` and `CanBeIncapacitated`, and the parser ships
`getHealthStateName()`. **Zero references in `src/`.** The tab labelled "Health" edits `MinionModifiers`
_amounts_ and never touches the behavior actually named `Health`. The enum:

```
Perfect, Alright, Scuffed, Injured, Critical, Incapacitated, Dead, Invincible
```

No new action, reducer or selector needed — `useBehavior(gameObjectId, HealthBehavior)` plus the
existing `modifyBehavior` covers it. Add a "Condition" section at the top of `Health.tsx`: a select over
`HealthState`, a switch for `CanBeIncapacitated`, and a **Revive** button that sets `State: Perfect`,
restores `HitPoints` to its max, and clears `sicknesses`. **Effort: S.**

**Validate in-game before calling this done.** It is not certain ONI resurrects from `Health.State`
alone — death may also be latched in the `StateMachineController`. Suggestive evidence:
`reducer/clone-duplicant.ts` already blacklists `StateMachineController` when cloning. Test on a real
dead duplicant. If the state machine matters, Revive becomes a small reducer that also strips the death
SMI — still S–M, but a different change.

### 1.2 Rename a duplicant; edit gender and voice

`MinionIdentity.name` is **display-only**: both `DuplicantName.tsx` files render a bare `<Typography>`,
so the only way to rename today is the Raw Editor. The write path is already proven —
`clone-duplicant.ts` writes `name` directly. `MINION_IDENTITY_GENDERS` (`MALE`, `FEMALE`, `NB`) and
`MINION_IDENTITY_VOICES` are exported by the parser and unused.

Use `CommitTextField` (commits on blur) rather than dispatching per keystroke. While here, fix
`clone-duplicant.ts`'s hardcoded English `` `Clone of ${name}` `` by passing a pre-formatted name in the
action payload from `CloneMenuItem.tsx`, which has `t()`. **Effort: S. Risk:** `nameStringKey` may need
clearing when a custom name is set, or the game may re-derive the display name from it.

### 1.3 Rename the colony; set the cycle number

`header.gameInfo.baseName` and `numberOfCycles` are display-only in `SaveOverview.tsx`. New
`modify-game-info` action and reducer, mirroring `modify-difficulty.ts`. Second-order win:
`saga/save-onisave.ts` derives the download filename from `baseName`, so renaming fixes the export name
too. **Effort: S. Risk:** `numberOfCycles` likely lives in both the header and the `SaveGame` behavior —
write both, exactly as `modify-difficulty.ts` already mirrors `sandboxEnabled`.

### 1.4 Un-comment the example save — the cheapest item in this document

`NoSave.tsx` has a working `<LoadExampleButton />` and its copy sitting inside a JSX comment. The whole
`load-example` action and reducer path is built and registered, and `ExampleChip` can currently never
appear. Deleting two comment markers gives every first-time visitor a way to try the editor without
owning a save. **Effort: XS.**

### 1.5 Search and sort the duplicant list

No filter, no sort — a 20-duplicant colony is a wall of cards. Copy the search idiom from
`MaterialsTable.tsx`. Sorting needs names at list level, so add a `duplicantSummariesSelector` returning
`{ id, name, traitIds }` via `createServiceSelector`. **Build this selector once here** — bulk edit
(2.2) and the omnibar (3.1) both need exactly it. **Effort: S.**

### 1.6 Unsaved-changes guard

There is no `beforeunload` handler. Closing the tab, or loading a second save, silently discards every
edit. `isModified` already exists — this is a hook reading `isModifiedSelector`, registering the
listener, mounted once in the shell, plus a confirmation in `AbstractLoadButton`. **Effort: S**, and the
highest safety-per-line in this document. Depends on 0.1.

### 1.7 Save progress feedback — #1

`saga/save-onisave.ts` already emits `receiveOniSaveBegin(LoadingStatus.Saving)` and streams progress,
and `LoadingDialog` exists. **Check whether the dialog is mounted for the Saving status before writing
any code** — this may be a zero- or one-line fix. **Effort: XS–S.**

---

## Tier 2 — Real work, real demand

### 2.1 Undo / redo

The mitigation for every "it corrupted my save" report, and what makes bulk edit and delete safe to ship.

**Do not snapshot `SaveGame`.** A parsed save is very large; a stack of N snapshots is a memory disaster.
Journal _inverses_ instead. The overwhelming majority of edits funnel through three reducers —
`modify-behavior.ts`, `modify-behavior-path.ts`, `modify-raw.ts` — each of which knows exactly which
slice it replaced. Capture `{ gameObjectId, behaviorName, dataKey, previousData }` into a bounded
history in `OniSaveState`. Structural actions (`clone-duplicant`, `mega-duplicant`, delete) need a
coarser entry: snapshot only the affected `GameObjectGroup`, which `reducer/utils.ts` already isolates
via `addGameObject` / `removeGameObject`.

**Effort: M** for behavior-level, **L** if structural actions are in the first version. Ship
behavior-level first and grey out undo for structural actions rather than lying about them. **Risk:** the
real danger is a _silent_ gap — a reducer that mutates without journalling produces a broken undo, which
is worse than no undo. Gate it: every reducer either journals or is explicitly listed as non-undoable.

### 2.2 Bulk edit across duplicants — #36, #33

The precedent exists: `reducer/mega-duplicant.ts` already applies a computed set of traits, aptitudes and
attributes to one duplicant, including the genuinely hard part — `megaTraitIds()` resolving mutual
exclusivity and DLC gating. Generalize to `{ gameObjectIds, operations }` and loop
`changeStateBehaviorData`. UI: multi-select on `DuplicantListItem` plus an "Apply to selected" dialog
reusing `AddTraitButton` / `AddAptitudeButton` / `AttributeField` as the pickers.

**Effort: M. Risk:** trait exclusivity and DLC gating must be re-checked per duplicant — a bionic and a
standard duplicant accept different trait sets. Reuse `megaTraitIds(dlcIds)`; do not reimplement. Put a
confirmation naming the affected count on it.

### 2.3 Delete a duplicant or a game object — #80, #67

**Already half-built:** `reducer/utils.ts` exports a complete `removeGameObject(saveGame, gameObjectId)`
and **nothing in the codebase calls it.** The action, reducer and menu item are trivial.

**The real work is dangling references,** and this is the item most likely to corrupt a save. A duplicant
owns a paired `MinionAssignablesProxy` game object, referenced by
`MinionIdentity.templateData.assignableProxy.id` — `clone-duplicant.ts` already resets that to `-1`,
which tells you the game cares. Plus schedule slots, room ownership and skill assignments. Delete the
object, delete its proxy, sweep for id references. **Effort: S for the mechanism, M for correctness.**
Ship _after_ undo.

### 2.4 A real creature editor

`/creatures/:id` is a live, linked, routed page that prints "Not implemented" — a promise the nav bar
makes and the app breaks. Critters carry `ModifiersBehavior` (`"Klei.AI.Modifiers"`), structurally the
same shape the duplicant Health tab already edits via `MinionModifiers`. So: generalize
`Health/components/Value.tsx` to take a behavior name, then **enumerate `extraData.amounts` from the save
rather than hardcoding names** — a Hatch and a Pacu expose different amounts. Add
`PrimaryElement._Temperature` while there.

**Effort: M. Risk:** creature portraits are a separate, larger problem (no critter sprite pipeline) —
ship with a type-name placeholder, do not block on art.

### 2.5 Temperature and germ tooling

`PrimaryElement` gives `ElementID`, `Units`, `_Temperature`, `diseaseID`, `diseaseCount` per object.
Scope to bulk operations on the Materials page — "set temperature of all X", "clear all germs".

**Effort: M. Risk:** a temperature outside an element's phase range makes the sim convert the object on
load, and the parser ships no phase-transition table. Either hand-build one and clamp, or warn loudly.
**It cannot touch tile or sim data** — only loose and stored objects. Say so in the UI, or expect "it
didn't cool my base" issues.

---

## Tier 3 — Later

- **3.1 Omnibar (#22)** — mostly free _if_ 1.5's `duplicantSummariesSelector` and the existing
  `gameObjectsById` selectors are the index. Build after per-page search, so you know what people search
  for. **M.**
- **3.2 Storage editing (#28)** — `StorageBehavior.extraData` is a round-tripped array of nested game
  objects, and `selectors/material.ts` already walks it. View, delete and re-mass are tractable;
  _adding_ means synthesizing a whole `GameObject` with valid behaviors and a fresh `KPrefabID`. Ship
  read, delete and edit-mass; refuse "add" until there is a template factory. **L.**
- **3.3 Raw editor add/delete (#107)** — see "Advise against"; build the specific typed adds instead.
- **3.4 Printing pod / spawner editing (#30)** — genuinely wanted, but parser support is unconfirmed.
  **Needs a spike before it gets an estimate.**
- **3.5 French and Brazilian Portuguese (#108, #114, #109)** — repeatedly requested. Note the asymmetry:
  the game ships preinstalled catalogues only for ko, ru and zh, so `tools/extract-translations.py`
  cannot help; these are hand-translated `common.json` only, with game terms falling back to English.
  The blocker is a speaker, not code.
- **3.6 Reducer specs for new work** — not a feature, the enabler. Undo and bulk edit are pure-logic
  reducers, testable in the existing node environment with no new infrastructure. Write the specs as part
  of those features, not as a separate initiative.

---

## Advise against

- **Undo via full `SaveGame` snapshots** — journal inverses instead (2.1).
- **A map or tile editor** — `simData` and `world.streamed` are opaque buffers the parser does not model.
  Not reachable from this architecture; better stated as a README limitation than accumulated as issues.
- **Rockets and the starmap** (`SpacecraftManagerBehavior`, the unused `space-destinations.ts`) —
  superficially attractive because the const data is sitting right there, but **no issue has ever asked
  for it**, the audience is narrow, and mission and destination state is heavily cross-referenced. Note
  the old Planets page was _removed_ in 3.20 as obsolete.
- **Generic "add anything" in the raw editor** — the save is template-driven; an arbitrary added node has
  no type template and will not unparse. What people asking for #107 actually want is a handful of
  specific typed adds. Note #65 already reported the raw editor destroying a file.
- **A restyle for its own sake** — this project's differentiator is correctness: the trait, skill and
  effect work, and the game-catalogue translation pipeline. Restyle incrementally as files are touched;
  `Difficulty.tsx` and `Health.tsx` are both being rewritten in Tier 0 anyway.
- **Anything server-side** (cloud saves, share links, analytics on save contents) — the value proposition
  is a static page that never sees your file.

---

## Milestones

### 1 — "Trustworthy edits"

Five small items, disjoint files, no new architecture.

| #         | Item                                                                             | Closes         |
| --------- | -------------------------------------------------------------------------------- | -------------- |
| 0.1       | Fix delete-all-loose-materials (predicate + `tryModifySaveGame` + rename + spec) | —              |
| 0.2       | Fix material mass units                                                          | #102, #130     |
| 1.6       | Unsaved-changes guard                                                            | —              |
| 1.1       | Revive dead duplicants                                                           | #91, #67, #45  |
| 0.3 + 0.4 | Difficulty labels, explicit sandbox switch, Health headers                       | #115, #99, #60 |

It closes six issues and satisfies two of the three loudest recurring asks — by _labelling_ one feature
and _binding a select_ to another, not by building anything new. It removes both places where the app
reports wrong numbers, which is what erodes trust in an editor. And 1.6 retires the "I lost my edits"
failure the README currently apologises for.

**Sequencing constraints:** 0.1 must precede 1.6 (and later 2.1) — a reducer that mutates without setting
the dirty flag makes both the guard and the undo history lie. 1.1 needs an in-game validation pass before
it counts as done.

### 2 — "Names and lists"

1.2 rename, gender and voice · 1.3 colony rename and cycles · 1.4 example save · 1.5 list search and
sort · 0.5 import errors. All small, and 1.5 builds the selector that 2.2 and 3.1 both need.

### 3 — "Power tools"

2.1 undo, then 2.2 bulk edit, then 2.3 delete — strictly in that order, because the last two are exactly
what makes a missing undo unforgivable.

---

## Patterns to reuse

New work should follow what is already here rather than inventing alternatives.

- `useBehavior(gameObjectId, BehaviorName)` → `{ templateData, onTemplateDataModify }` — how every
  existing tab reads and writes a behavior
- `tryModifySaveGame` in `reducer/utils.ts` wraps a mutation and sets `isModified`. That file also holds
  `changeStateBehaviorData` and the currently-unused `removeGameObject`
- One file per action in `actions/` (creator, `ACTION_*` const, `isXAction` guard); one reducer per
  action, registered in `reducer/index.ts` via `reduceReducers`
- `CommitTextField` for text that should commit on blur — the Skills tab's Experience field currently
  dispatches per keystroke and should migrate to it
- `worlds.ts` is the cleanest domain-module template: prefab names, id → i18n key, name sorting, and it
  declares an untyped behavior shape locally rather than waiting on a parser release
- New components are single-file `Foo.tsx` with `useSelector` / `makeStyles`, not the legacy
  `component.tsx` + `connector.ts` + `connect()` idiom
- Game-term strings come from the game's own catalogue via `tools/extract-translations.py`; UI strings go
  in `src/translations/en/common.json` and then the five other locales

## Verifying a change

- `npm run typecheck && npm test && npm run build && npm run lint` — the standing bar
- New reducer logic gets a spec beside it (`*.spec.ts`, node environment), where the existing specs live
- Component tests are possible: jsdom is installed and works via a `@jest-environment jsdom` docblock,
  with CSS and asset stubs wired in `test/`
- Manual pass: `npm start`, then `loadMockSave()` in the console (dev builds only, `src/debug.ts`) to
  reach the editor without a real save
- **Anything touching save writing must be round-tripped through the actual game.** A clean parse here is
  not proof the game accepts the result — which is the entire reason Tier 2 exists

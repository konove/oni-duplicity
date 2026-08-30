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

Three conclusions shaped the ordering:

- **The loudest asks are mostly already built.** "Revive dead duplicants" (3 issues) is still open as
  1.1, and turned out to be a different change from the one described here for months — the field it
  planned to edit is not in the save at all. "Sandbox mode" (3 issues)
  shipped all along — nobody could find it because the panel printed `SandboxMode` / `Enabled` as raw
  identifiers, which 0.3 fixed.
- **This is a trust problem more than a capability problem.** No undo, no unsaved-changes guard, no
  backup, under a README that opens by telling you to back up your save. Every feature that mutates more
  state at once makes that worse unless the safety net lands alongside it. Still true: 1.6 and 2.1 are
  both open.
- **Three shipped features reported wrong numbers.** Users who hit those don't file a feature request.
  All three are fixed — material mass by a factor of 1000 (0.2), 285.4 t of material missing entirely
  (0.7), and every geyser setting labelled as a percentage of nothing (0.10).

**Where it stands.** Twelve entries are marked **done** and carry a note saying what shipped: 0.1
through 0.8, 0.10, 1.7 — which needed no code at all, only checking — 1.8 and 1.9. A thirteenth, 0.9, closed
the other way: the editor's totals differ from the game's panel because the panel hides unreachable
material and counts one asteroid, so there was never anything to fix. **Tier 0 is down to four**, and
all four are questions about how the thing is laid out rather than what it can see (0.11 to 0.14).
Tier 1 has 1.1 through 1.6 open; 1.7, 1.8 and 1.9 are done. 1.9 was filed and closed the same day - the
Materials page could list seeds, eggs and food but named them by splitting the prefab id, which turned
Snac Fruit into "Garden Forage Plant".

---

## Tier 0 — Bugs that read as missing features

Ship first. All small, and each is something a user believes is missing or broken.

### 0.1 "Delete all loose materials" deletes only Aerogel — **done**

**Done.** The predicate is a real boolean and the file is spelled `delete-loose-material.ts`. It routes through `tryModifySaveGame`, so the modified flag is set, and `delete-loose-material.spec.ts` sits beside it.

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

### 0.2 Materials page reports mass off by 1000× — #102, #130 — **done**

**Done.** The selector accumulates `looseMass`/`storedMass` and `formatMass` mirrors `GameUtil.AppendFormattedMass` — the tiers are 5 and 5000, not 1 and 1000, which is why 2,544 kg of algae stays in kilograms while 115,665 kg of dirt reads in tons.

`selectors/material.ts` accumulates `PrimaryElement.templateData.Units` into `looseGrams`/`storedGrams`;
`MaterialsTable.tsx#formatWeight` then treats `< 1000` as grams. ONI stores element mass in
**kilograms**, so a 400 kg ore pile renders as "400 g". Fix in the selector (rename to
`looseMass`/`storedMass` — one consumer) and rewrite `formatWeight` for kg input: `< 1` → g, `< 1000` →
kg, else tonnes. Needs one new i18n leaf (`material.tonne`) across all six locales.

**Effort: S. Risk:** confirm the unit against a save with a known-mass storage bin before changing the
divisor — do not take the issue's word or this document's.

### 0.3 The sandbox toggle exists and is unreadable — #115, #99, #60 — **done**

**Done.** Settings and their levels resolve through `oni:DIFFICULTY.*` from the game's own catalogue, and Sandbox is lifted out of the grid into its own switch.

The write path is already complete and correct: `reducer/modify-difficulty.ts` sets
`CurrentQualityLevelsBySetting` _and_ mirrors `SandboxMode` onto `header.gameInfo.sandboxEnabled`. But
`SaveOverview/components/Difficulty.tsx` renders raw enum keys, so the thrice-requested sandbox switch is
labelled `SandboxMode` with options `Enabled`/`Disabled`, sitting in a grid next to `CalorieBurn`.

**This is a labelling problem only.** Add `src/services/oni-save/difficulty.ts` on the `worlds.ts`
template, mapping each setting and value to a catalogue key, resolved with the
`t("oni:...", { defaultValue: name })` idiom already used in `MaterialsTable.tsx`. Then lift Sandbox out
of the grid into its own labelled switch. **Effort: S–M.**

### 0.4 Health tab section headers are untranslatable — **done**

**Done.** All three carry an `i18nKey` and are translated in every locale.

`Health.tsx` uses bare `<Trans>Fitness</Trans>`, `<Trans>Mind</Trans>`, `<Trans>Disease</Trans>` with no
`i18nKey`, so five of six locales show English. **Effort: XS** — fold into 0.3's translation pass.

### 0.5 Import failures are silent — **done**

**Done.** `ImportErrorDialog` names the reason — unreadable, invalid JSON, wrong shape, or exported from a different kind of object.

`saga/import-behaviors.ts` has a `TODO: show dialog`; errors reach `console.error` only, so a bad import
looks like nothing happening. `ImportWarningDialog` already exists for the checksum case. **Effort: S.**

### 0.6 Geysers page shows raw enum names — **done**

**Done.** Names come from the catalogue, the dropdown sorts by them, the sliders are controlled, and `iterationLengthRoll` has a control. Superseded in full by 0.10, which put real units on all five. Nothing was needed for #137: the issue spelled `molten_aluminum` as aluminium.

Raw `GeyserType` keys in the dropdown and heading; sliders are uncontrolled (`defaultValue`) with no
numeric readout; `iterationLengthRoll` has no control at all. See also #137 (a missing geyser type).
Same class of defect as 0.3 — bundle with it. **Effort: S–M.**

### 0.7 The Materials page hides elements the parser has never heard of — **done**

The enum now lists all **212**, the count was 211 because `COMPOSITION` is in
the game's element list without being an element — Klei put it there to reach
the enum, and it is mirrored for the same reason. All 285.4 t below now show on
the Materials page, re-measured against the same colony.

`tools/extract-sim-hashes.py` needs no decompiler in the end: the game ships its
element list as plain YAML and the C# enum is generated from it, so names plus
`Hash.SDBMLower` reproduce the enum exactly. That was checked three ways before
anything was generated — every decompiled value equals the hash of its own name,
so does every value the parser already had, and the YAML ids reproduce the
decompiled enum name for name. The regenerated file was 63 insertions and zero
deletions, which is the outcome the risk note below asked for.

Worth knowing for next time: the element ids and their **display names** are two
separate extractions. `extract-translations.py` reads ids from the installed
parser, so the 63 new elements had no name until it was re-run for en, ru, ko
and zh. `materials.spec.ts` now fails if the catalogue falls behind the enum.

`MaterialGameObjectNames` is the parser's `SimHashNames`, which lists **149**
elements. The game's own `SimHashes` enum has **211**. Anything in the gap is
simply absent from the table — not zero, not "other", just missing.

Measured on a real colony: **285.4 t across three element types are invisible** —
Shale 197.4 t, NickelOre 44.1 t, Peat 43.9 t. Shale alone is more than the dirt
whose units 0.2 corrected, and it is the largest single material in that save.

The values are recoverable the same way the trait and skill tables are: decompile
`SimHashes` from `Assembly-CSharp.dll` (the `ilspycmd` workflow in
`tools/README.md` — the enum comes out complete, with hashes) and regenerate
`src/save-structure/const-data/template-enumerations/sim-hashes.ts` in the parser
fork. That means a `tools/extract-sim-hashes.py` alongside the other extractors,
then the fork round trip: build, commit, push, re-pin the sha here.

**Effort: M**, mostly the fork round trip. **Risk:** the enum is the parser's
element identity, so a wrong hash mis-identifies material rather than omitting
it. Diff the regenerated file against the current one and expect additions only.

### 0.8 Seeds and other sweepables are not listed at all — **done**

Shipped with the page redesign. What belongs is decided by the save rather than
by a list somebody keeps: a material is an object with `Pickupable` and no
`*Brain`, which is what keeps a colony's 57 Chameleons and its duplicants off a
materials page, and the kind comes off behaviours the game already attached -
`PlantableSeed`, `Edible`, `Equippable`. Only eggs are recognised by name,
because a Chameleon Egg carries nothing a research databank does not.

Each kind carries its own unit, mirroring the game's own three-way split:
kilograms for elements, kilocalories for food, and a count of seeds, eggs or
units for the rest. That answers the risk this entry raised - picking seeds
alone was arbitrary, so nothing is picked; everything sweepable is listed and
the unit follows the thing.

**Still open: the names.** Non-elements render a humanised prefab id - "Sea
Lettuce Seed" for `SeaLettuceSeed` - which is close to the game's own name and
is the same fallback the 63 uncatalogued elements already use. The game names
each item from a string key chosen per config class, so there is no id-to-key
rule to follow; only 14 of 139 `CreateLooseEntity` call sites pass the literal
`ID` and a `STRINGS.` constant together. Filed as 1.9.

### 0.9 The editor counts material the game does not — **resolved, and not a bug**

Tracked down on the colony itself: the 92 kg of algae the game did not report was
lying where no duplicant could reach it. The assembly says the same, and adds
four more exclusions nobody would guess.

Everything the game's panel counts reaches `WorldInventory.Inventory` through a
single event that `FetchableMonitor` fires on entering its `fetchable` state, and
`IsFetchable()` refuses an object that is unreachable, entombed, equipped, tagged
`StoredPrivate`, reserved by a critter, or a critter that is not itself
deliverable. `WorldInventory.Update` then sums only objects whose
`GetMyWorldId()` matches its own — so the panel is **one asteroid**, not the
cluster.

None of that is in the save. Both state machines declare `base.serializable =
SerializeType.Never`, and reachability is recomputed every second from
`MinionGroupProber.IsAllReachable` over the pathfinding grid — which this editor
cannot reproduce even in principle, since the tile data is an opaque buffer the
parser does not model.

So `materialsSelector` walking every group in the file is correct. The editor's
job is to total what the save contains — buried, out of reach, worn and
off-asteroid included — and that is simply not the number on the panel, and never
can be.

**What is left is one sentence of copy** on the Materials page saying so.
Without it the page keeps failing a comparison it was never making, which is the
same loss of trust the wrong numbers in 0.2, 0.7 and 0.10 caused, arrived at from
the opposite direction. **Effort: XS.**

### 0.10 Geyser sliders edit a number nobody can read — **done**

Shipped in `src/services/oni-save/geyser-configuration.ts`: the full 27-type
table, `Resample` and its inverse, and the derived rates. `Resample` is checked
against the `scaled*` values a real save stores beside its rolls, which makes
the curve verified rather than believed. Two rows — Erupting and Active — set a
percentage rather than an absolute, because the save stores them as fractions of
the row above and an absolute range there would re-scale as the reader dragged
something else. A **Best case** button sets output and active share to their
maximum and the full cycle to its minimum; the eruption timings are left
alone, since burstiness is a preference rather than an improvement.

Still open from the design pass: a **geotuned** geyser reports modified numbers
in game while the save keeps the base rolls. The card shows the base rolls, and
nothing says so. Needs a geotuned save to check against.

The five sliders edit the raw rolls stored in the save and label them as
percentages. The game turns each roll into a real value by resampling it between
that geyser type's own min and max — and not linearly: `GeyserConfigurator.
Resample` is a logit curve, so a roll of 0.996 lands at 1030s in a 480–1080s
range while 0.5 sits at the midpoint. "99.6%" is not "99.6% of the way to
maximum", and 50% on a copper volcano means nothing like 50% on a steam vent.

Verified against a real colony's Copper Volcano U014, reproducing all four
numbers the game's panel shows: 79s active every 1030s, 91.8 cycles every 153.1
cycles, 6.9 kg/s while erupting, 317 g/s average.

Needs the per-type tuning table — 27 types by roughly ten numbers, sitting in
`GeyserGenericConfig` as `new GeyserType("molten_copper", …, 480f, 1080f,
1f/60f, 0.1f)` — extracted the way the skill and effect tables already are, plus
`Resample` and its inverse so a slider can set a real value and store the roll
that produces it. **Effort: M**, and the risky half is done: the maths is
verified rather than assumed.

### 0.11 The editor does not orient a new arrival

From "I have a .sav" to "I changed the thing I wanted" there is no guidance:
most of the nav does nothing until a save loads, the overview is a name and four
numbers, and nothing says what this editor is for or what is safe to touch.
**Effort: M**, and mostly copy and sequencing rather than new machinery.

### 0.12 The duplicant editor is the densest screen and the least organised — **direction A shipped**

Five tabs — Attributes, Appearance, Health, Skills, Effects — under a header
that already carries the portrait, every trait chip and every interest chip.
Attributes alone is 30-odd numeric fields. It is the screen people spend their
time in and the one with the least deliberate layout. **Effort: M–L.**

Measured before touching it: the first editable field sat at y=444 of a 720-tall
window. A 64px app bar, a name row that only printed the name, a 202px identity
block built out of two `h6` headings and three dividers, and a 48px tab bar —
and the identity block was re-paid on every tab, including Health and Skills,
which have nothing to do with traits. "Secondary" was a heading whose fields sat
below the fold.

Shipped as `IdentityBand`: a 100px portrait, the name and an identity line
beside it, and traits and interests as two labelled runs of chips with no
headings and no dividers. 136px where the name row and the block together took 267. Tab content now starts at 248 and the first field at 341, so both attribute
groups fit at 720 — which `e2e/duplicant-editor.spec.ts` asserts directly rather
than photographing, because a full-page screenshot records a regression as a
taller image and passes.

Two changes inside the Attributes tab came with it. Each cell reads
name-then-value on its own hairline, so a column of names scans and the values
line up on a right rail; the hairline is load-bearing, because without it a
right-aligned value reads as belonging to the next column's label. And the
attributes sitting at 0 — fifteen of Ada's seventeen — are dimmed, so what is
set is visible without reading every number.

The identity line is where 1.2's name, gender and voice controls land: it
already prints all three, as text.

One correction to the entry above: 30-odd is the count on a fuller save. The
bundled example carries 17, so the fold problem the numbers here describe is the
light case rather than the bad one.

Still open, in the order their reasons arrive — the design pass drew seven
directions and this was the first:

- **A roster column inside the editor**, when 1.5 or 2.2 is built. Editing a
  colony is not one duplicant, it is twelve, and every switch today is back,
  scan the wall of identical cards, click. That column is the same work as list
  search and multi-select.
- **"What is on, plus Add" for Skills and Effects**, whichever layout wins.
  Fifty-four checkboxes to express one mastery is the worst ratio on the page.
- **Field search**, after 3.1's omnibar exists.
- **One scrolling document with a rail**, when the editor has a second reason to
  be opened. The band is a step toward it, not a competitor.
- **Verb cards** — Mega, Clone, Revive — only after 1.6 and 2.1. One-click bulk
  mutation with no undo and no unsaved-changes guard is the combination the
  README already apologises for.

Noticed while measuring and still unfixed: the Health tab labels its sliders
with raw ids (`HitPoints`, `ImmuneLevel`) because `oni:todo-trans.modifiers.*`
has no entries, Calories rides a 0–4,000,000 slider, and Breath is 200 on a
slider whose maximum is 100 — the handle pins at the end and says nothing.

### 0.13 The page split may not match how people edit a colony

Duplicants, Creatures, Geysers, Worlds, Materials, Raw Editor: that carving
follows the save's object types rather than any task someone sits down to do.
Worth asking whether the drawer should be organised around what people came to
change. **Effort: L, and a design question before it is an engineering one.**

### 0.14 Nothing in a list says _which_ one it is

Every list page renders identical cards. Two copper volcanoes are
indistinguishable, and in a Spaced Out cluster the two next to each other in the
grid may be on different asteroids — the page gives no hint either way. It
affects Creatures and Duplicants the same way; geysers are just where it was
noticed.

Both halves of the answer are already in the save and thrown away:

- **The object has a name.** A geyser carries a `UserNameable` behavior, and in
  the mock save it holds `"Cool Chlorine Gas Vent UO31‑3"` — the game's own
  per-object identifier, code and all. The card prints the _type_ name twice
  instead, in the heading and again in the dropdown. Showing `savedName` as the
  heading is small and fixes most of this on its own.
- **The asteroid is a rectangle test.** There is no per-object world id;
  `worlds.ts` already documents why. Worlds tile one global grid, so each owns
  the rect at its `WorldContainer.worldOffset` of size `worldSize`, and an
  object belongs to whichever rect contains its position. Confirmed against the
  mock save, which has two asteroids: the geyser at `(111.5, 125)` resolves to
  world 0 and only world 0. `worldDisplayName()` already exists for the heading.

**Verify first:** whether `savedName` is ever empty. Only one geyser has been
looked at. If a never-renamed object stores `""` rather than the auto-generated
name, the heading needs a fallback to the type name.

**Effort: S** for the name, **M** for grouping. **Decide up front** whether the
position-to-world join is a shared selector — every list page wants it — or a
one-off on the Geysers page. Doing it once is the reason to build it
deliberately rather than inline. Grouping is also a layout question (headings,
collapsing, what happens in a one-asteroid base-game save) and worth a design
pass before code.

---

## Tier 1 — Cheap wins, mostly already built

### 1.1 Revive dead duplicants — the highest demand-to-effort ratio here (#91, #67, #45)

**The premise this entry carried for months was wrong.** It planned to edit a field the save does not
contain. Reading a real save with a real dead duplicant in it is what found that out, and it changes the
work rather than the priority.

What the parser promises: `HealthBehavior` ("Health") is typed as
`{ CanBeIncapacitated: boolean; State: HealthState }`, and `getHealthStateName()` ships alongside the
eight-value enum — `Perfect, Alright, Scuffed, Injured, Critical, Incapacitated, Dead, Invincible`.

What a save contains: saves are self-describing, and the `Health` type template declares **exactly one
field, `canBeIncapacitated`** — lowercase, with no `State` beside it. Checked on save versions 7.28 and
7.38 and on the bundled example. There is no state to select over, nothing to set to `Perfect`, and
nothing for `getHealthStateName()` to read. The parser's type does not describe these saves.

**Death is marked on `FactionAlignment`.** From a save where Otto suffocated, against his three
surviving colonists:

| Duplicant            | `alignmentActive` | `targetable` |
| -------------------- | ----------------- | ------------ |
| Otto — dead          | `false`           | `false`      |
| Leira, Ruby, Bubbles | `true`            | `true`       |

That is the only field that differs anywhere across his 54 behaviors. Same behavior set as the living
ones, no `DeathMonitor+Instance` attached, `serializedTags` empty on everybody, and `Health` reading
`canBeIncapacitated: true` on the dead duplicant exactly as on the living ones.

**No vital gives it away.** A dead duplicant sits at full hit points and full immunity. Otto's breath is
0 because he suffocated; one who starved or froze would read 100 there. His other amounts are simply
frozen where he left them — stress 11.8, decor −130, bladder 100. There is nothing to threshold, which
also means the Health tab as it stands cannot tell you anyone has died.

**The marker survives distance.** In a 21-duplicant Spaced Out save, four of them living on a second
asteroid — Burt, Turner, Quinn and Ashkan at x≈300, y≈60, against x 69–166, y 159–234 for the other
seventeen — every one reads `alignmentActive: true`. Being off the home planetoid does not clear it.
Still unchecked: a duplicant in a rocket mid-flight.

**A second signal, if one is wanted:** the three survivors each carry a `Mourning` effect. Not a marker
on the dead duplicant, but a way to notice a death happened at all.

**The plan, revised.** The parser ships no `FactionAlignmentBehavior`, but it does not need to: a
five-line `interface` in `src/` plus `"FactionAlignment" as BehaviorName<…>` typechecks against the
existing `useBehavior` and `modifyBehavior`, verified with `tsc -p src`. No fork round trip, no new
action, reducer or selector. Read `alignmentActive` to know; write `alignmentActive` and `targetable`
back to `true` to revive.

Where it belongs on screen is designed in `design/duplicant-one-screen/` — four options, recommending
two of them together: mark the duplicant in the identity band **and** on the duplicants list (which is
the only place you can discover a death without opening every card in turn), with **Revive** as the
first entry in the actions menu, omitted rather than disabled on a living duplicant, the way the
Materials row menu does it. A "Condition" select over `HealthState` was the fourth option and is ruled
out by the save, not by taste.

**Validate in-game before calling this done.** The old warning still stands, aimed at a different field:
it is not certain ONI resurrects from `FactionAlignment` alone, because death may also be latched in the
`StateMachineController` — attached to every duplicant, carrying no serialized fields, and already
blacklisted by `reducer/clone-duplicant.ts` when cloning. If the state machine matters, Revive becomes a
small reducer that also strips the death SMI.

Note for whoever builds it: `src/__mocks__/save-game.json` has no dead duplicant — Ada, Bruno and Steela
all read `alignmentActive: true` — so the marker needs a fixture before it can have a test.

**Effort: S for the marker, S–M for Revive.** The same size as before, but a different change, with the
risk now concentrated in whether the write takes.

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

### 1.7 Save progress feedback — #1 — **done**

**Done, and it already was.** The suspicion in this entry was right — no code was needed. `LoadingDialog` is mounted in `root.tsx` and its connector opens on `LoadingStatus.Saving`, so the progress the saga already streams does reach the screen.

`saga/save-onisave.ts` already emits `receiveOniSaveBegin(LoadingStatus.Saving)` and streams progress,
and `LoadingDialog` exists. **Check whether the dialog is mounted for the Saving status before writing
any code** — this may be a zero- or one-line fix. **Effort: XS–S.**

### 1.8 A row menu on the Materials page — **done**

Shipped as designed. One overflow menu per row, each entry naming its own
quantity, and entries that do not apply omitted rather than disabled - which is
why Water and Chlorine Gas carry no menu at all: they exist only inside
containers and there is nothing loose to delete. 2.6 adds the second entry
without the page growing a second control.

Two things the design pass did not anticipate. The whole-table "delete all
loose material" needed somewhere to live and went into a header menu in the
same column, so the affordance reads the same at both levels. And the deferred
fourth direction - row selection with an action bar - is unchanged in status:
still the right investment when 2.2 lands, and it can now wrap the row menu
rather than replace it.

### 1.9 Non-elements show a humanised id rather than the game's name — **done**

Filed and closed the same day, because the premise of the entry was wrong. It
said splitting the prefab id lands "close" to the game's name, which holds for
`SeaLettuceSeed` and does not hold at all for the DLC plants a real colony is
full of, where the id is an internal codename:

| Split id                | The game's name |
| ----------------------- | --------------- |
| Garden Forage Plant     | Snac Fruit      |
| Garden Food Plant Food  | Sweatcorn       |
| Garden Decor Plant Seed | Rosebush Seed   |
| Sea Lettuce Seed        | Waterweed Seed  |

`tools/extract-item-names.py` resolves it without knowing any helper's
signature. The rule is one observation about the game's entity templates - the
display name is always the argument straight after the prefab id, in
`CreateLooseEntity`, `CreateAndRegisterSeedForPlant` and
`ExtendEntityToFertileCreature` alike - so it resolves what it can of every
argument in every `*Config.cs` and records a pair wherever an id is followed by
a catalogue key. Equipment and artifacts get a rule each, since one takes no
name argument and the other builds its id at runtime.

672 names, in English and the three languages the game ships catalogues for;
Czech and Spanish fall back to English exactly as they already do for elements.
Every material across two real colonies resolves.

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

**Where it surfaces is already decided:** both are entries in 1.8's row menu, below the divider that
separates them from the two deletes, because they act on the whole row rather than on loose or stored
separately. 1.8 has shipped, so both have somewhere to land.

**Effort: M. Risk:** a temperature outside an element's phase range makes the sim convert the object on
load, and the parser ships no phase-transition table. Either hand-build one and clamp, or warn loudly.
**It cannot touch tile or sim data** — only loose and stored objects. Say so in the UI, or expect "it
didn't cool my base" issues.

### 2.6 Delete material out of containers

The Materials page can delete an element's loose material and nothing else. That is not a UI gap: it is
the only delete path that exists. `delete-loose-material.ts` filters top-level object groups, and
anything stored is nested inside a `Storage` behavior's `extraData`, which **no reducer writes to at
all** — the only mention of `Storage` in `reducer/` is the comment saying that one does not touch it.

On a real colony that leaves ten element types unreachable, four of them reachable by no other means:
Water, Chlorine Gas, Oxygen and Carbon Dioxide exist only inside containers there, so the page renders
them with no delete button and no alternative.

**Where it surfaces:** the second entry in 1.8's row menu, reading "Delete 200 kg in containers" — the
quantity is in the label because a row can offer both deletes at once and they must not be confusable.

**The mechanism is a filter.** `StorageBehavior.extraData` is a plain `StoredGameObject[]`, so removing
an item is one `filter` call. What it cannot use is the generic path: `modifyBehavior` with
`BehaviorDataTarget.Extra` merges by key — lodash `merge` for the deep case, object spread otherwise —
and neither can _shorten_ an array. This needs its own action and reducer.

**Effort: S for the mechanism, M for correctness.** **Risk:** the same dangling references as 2.3. A
stored item carries a `KPrefabID.InstanceID` that fetch errands and delivery lists can point at, and a
half-eaten ration is referenced by whoever was carrying it. Sequence it with 2.3 rather than separately,
and round trip the result through the actual game — a clean parse here proves nothing about whether the
colony still loads.

Two smaller questions that fall out of the same place: deletion is per element type, never per pile, so
"delete one of my 129 shale clumps" has no expression today; and it is worth deciding whether emptying a
container should delete the contents or leave them loose on the floor, which is what the game itself
does when a bin is deconstructed.
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

### 1 — "Trustworthy edits" — three of five shipped

Five small items, disjoint files, no new architecture.

| #         | Item                                                                             | Closes         | Status |
| --------- | -------------------------------------------------------------------------------- | -------------- | ------ |
| 0.1       | Fix delete-all-loose-materials (predicate + `tryModifySaveGame` + rename + spec) | —              | done   |
| 0.2       | Fix material mass units                                                          | #102, #130     | done   |
| 0.3 + 0.4 | Difficulty labels, explicit sandbox switch, Health headers                       | #115, #99, #60 | done   |
| 1.6       | Unsaved-changes guard                                                            | —              | open   |
| 1.1       | Revive dead duplicants                                                           | #91, #67, #45  | open   |

The three that shipped were the labelling and the wrong numbers, and between them they closed five
issues without building anything new. What is left is the half that touches state rather than
presentation: 1.6, which retires the "I lost my edits" failure the README apologises for, and 1.1, which
is one boolean on a behavior the parser does not type yet.

**Sequencing constraints:** 0.1 had to precede 1.6 (and later 2.1) — a reducer that mutates without
setting the dirty flag makes both the guard and the undo history lie. That one is done, so 1.6 is
unblocked. 1.1 still needs an in-game validation pass before it counts as done — now against
`FactionAlignment` rather than `Health`, which is where reading a real save moved it.

### 2 — "Names and lists" — one of five shipped

0.5 import errors is done. Left: 1.2 rename, gender and voice · 1.3 colony rename and cycles · 1.4
example save · 1.5 list search and sort. All small, and 1.5 builds the selector that 2.2 and 3.1 both
need.

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

# tools

One-off generators. Not part of the build; run by hand when the game updates.

## extract-trait-effects.py

Regenerates the `EFFECTS` arrays in `src/translations/en/oni.json` — the lines
under each trait's tooltip saying what it actually does.

Only a trait's flavour text lives in the game's string table. What it _gives_
(`Athletics: -5`, `Cannot do Digging Errands`, `Immune to Chilly Surroundings`)
is built at runtime from the trait's data, so it has to come out of the
assembly. Klei.AI.Trait.GetTooltip is the shape this mirrors: description, then
attribute modifiers, disabled errands and effect immunities.

Needs a decompiled copy of the game:

```sh
dotnet tool install -g ilspycmd --add-source https://api.nuget.org/v3/index.json
ilspycmd -p -o decomp "C:/Steam/steamapps/common/OxygenNotIncluded/OxygenNotIncluded_Data/Managed/Assembly-CSharp.dll"
python extract-trait-effects.py     # expects ./decomp alongside it
```

It reads `TUNING/TRAITS.cs` for the trait definitions, resolves the tuning
constants they reference (`GOOD_ATTRIBUTE_BONUS`, `BASESTATS.*`, decor tiers),
and formats each value the way that attribute's formatter would. It writes
`trait-effects.json`; merging that into `oni.json` is a separate step.

It reports any constant it could not resolve rather than guessing — if that
list is non-empty after a game update, fix it before trusting the output.

Two decor tiers are pinned by hand at the top: the `EffectorValues` scan cannot
pair a declaration with its `amount` once `MONUMENT`'s nested entries
interleave. Re-check them against `TUNING/BUILDINGS.cs` class `DECOR` when the
game updates.

## extract-translations.py

Builds `src/translations/<lang>/oni.json` from the game's own string catalogue.

Those strings are Klei's, not ours. A save editor that invents its own word for
a trait is worse than one showing English: the player picks traits by the name
their game uses. The game ships preinstalled translations as gettext catalogues
under `OxygenNotIncluded_Data/StreamingAssets/strings/`, currently ru, ko and
zh.

```sh
python extract-translations.py ru "C:/Steam/steamapps/common/OxygenNotIncluded"
```

Only keys already in `en/oni.json` are written, and only where the catalogue has
a translation - i18next falls back per key, so a partial file is better than a
padded one.

Four groups map by id once upper-cased: TRAITS, ATTRIBUTES, SKILLGROUPS, and
EFFECTS via `MODIFIERS`. Only SKILLS cannot - the game has no SKILLS string group
and our ids come from the assembly, where skill `Mining1` is role `Hard Digging`

- so it matches on the English name, and an id whose English is ambiguous across
  catalogue entries is skipped rather than guessed.

Match effects by id, not by name. `ExpellingGunk` and `StressfulyEmptyingBladder`
are both "Making a mess" in English and different words in Korean; a name match
has to discard both.

Anything already in the target file that the catalogue does not cover is kept, so
regenerating does not throw away hand-contributed entries for strings the game
has since dropped.

`CHOREGROUPS` is not the source for `SKILLGROUPS`, however much it looks like
one: chore group `ART` is "Decorating" where skill group `ART` is "Decorator".

The game marks its strings up in ways `en/oni.json` does not - `<link=...>`,
`<style="KKeyword">`, embedded newlines. `normalize()` strips that, and every run
checks it by rebuilding `en/oni.json`'s own values from the catalogue's English:
they must match exactly or the run stops. If a game update changes the markup,
that check fails instead of quietly writing differently-formatted output.

DLC pack names are absent from the catalogues and stay English.

## extract-skills.py

Regenerates the skill table in the parser
(`src/save-structure/const-data/skills/skills.ts`) and the `DUPLICANTS.SKILLS`
names in `src/translations/en/oni.json`.

Skills are not a flat list. Each records the content packs it needs and the
duplicant model it applies to, and both come from `Database/Skills.cs` - partly
as a `requiredDlcIds` constructor argument, partly as enclosing
`if (DlcManager.IsContentSubscribed(...))` blocks. Needs the same `decomp`
directory as the trait extractor above.

Two things to watch after a game update:

- A skill built in more than one branch takes the _intersection_ of the
  requirements, since it exists whenever any branch would build it.
  `Astronauting1` is one of these.
- Only a whole argument counts as the DLC list. Several skills switch their
  _perks_ on a DLC inline (`Farming1`), and matching a DLC id anywhere in the
  call would wrongly gate the skill itself.

## extract-effect-ids.py

Regenerates `AI_EFFECT_IDS` in the parser and the `DUPLICANTS.EFFECTS` names in
`src/translations/en/oni.json`.

There is no single list of effects in the game. Many are constructed with a
literal id, but whole families are built at runtime - `Decor0` through
`Decor5`, the `Edible` tiers, the room bonuses - so scanning code alone misses
exactly the ones duplicants carry most. Three sources are merged: `new
Effect("...")` literals from `decomp`, the ids in `save-effects.json`, and
whatever the parser already listed.

`save-effects.json` is committed because it cannot be regenerated without a
library of real saves. It was produced by parsing every colony and collecting
`Klei.AI.Effects` ids from `Minion` and `BionicMinion` objects only - sweeping
all game objects instead pulls in critter effects, which mean nothing on a
duplicant.

Effects from the assembly are kept only if they have a name in the game's
player-facing MODIFIERS strings, which is what filters the critter ones out.
Ten duplicant effects have no such name and fall back to their id.

## extract-sim-hashes.py

Regenerates `src/save-structure/const-data/template-enumerations/sim-hashes.ts`
in the **parser fork**, not in this repo.

`SimHashes` is the parser's element identity: a `PrimaryElement` names its
element by hash, and one the enum does not know cannot be named, so it is absent
from the Materials page rather than reported as unknown. The enum listed 149 of
the game's 212 entries; on one real colony that hid 285.4 t of material.

This is the one extractor that needs **no decompiler**. The game ships its
element list as plain YAML under
`OxygenNotIncluded_Data/StreamingAssets/elements/`, and Klei generates the C#
enum from it - the giveaway is the comment beside the list's last entry, `-
elementId: COMPOSITION #this is just here so it is added to the simhashes.cs
file!`. So COMPOSITION is not an element; it is mirrored anyway, because the
enum's job is to name whatever a save may contain.

```sh
python extract-sim-hashes.py            # writes ./sim-hashes.ts (git-ignored)
```

Values are `Hash.SDBMLower(elementId)`, which was verified three ways before the
script was trusted to generate anything: every value in the decompiled enum
equals the hash of its own name, so does every value the parser already had, and
the YAML ids reproduce the decompiled enum name for name. The script refuses to
write if a name the parser already knew would change value - a wrong hash
mis-identifies material rather than omitting it, which is worse.

Then the fork round trip: copy the file over, `npm run build` there, commit,
push, re-pin the sha in this repo's `package.json`, and **re-run
`extract-translations.py` for en, ru, ko and zh** - it reads the element ids
from the installed parser, so new elements have no display name until it does.

## extract-element-phases.py

Regenerates `src/services/oni-save/element-phases.ts` - what phase each of the
game's 212 elements is in.

The Materials page needs it to say what a pile of something _is_. Loose solid
lies around in clumps, loose liquid in bottles and loose gas in canisters;
Klei's own strings say "bottled liquids" and "Gas Canisters", and the split is
the one Sweep & Mop Orders makes. The page called all three "clumps", which was
wrong for every liquid in a colony.

Like `extract-sim-hashes.py` this needs **no decompiler** - it reads the same
YAML the game installs, one file per phase, and every entry declares its own
`state`:

```sh
python extract-element-phases.py "C:/Steam/steamapps/common/OxygenNotIncluded"
```

The declared `state` is read rather than the filename trusted, so an element
filed under the wrong phase is a loud failure instead of a quiet
miscategorisation.

## extract-food-calories.py

Regenerates `src/services/oni-save/food-calories.ts` - calories per unit for
all 75 foods.

Food is the one material whose quantity the game does not show in the unit the
save stores. A save records `PrimaryElement.Units`; `Edible.Calories` is
`Units * foodInfo.CaloriesPerUnit` and `GameUtil.AppendFormattedCalories`
divides by 1000 and forces kcal, so seven Ovagro Figs at 325,000 read as 2,275
kcal. That rate lives only in the assembly, as `TUNING.FOOD.FOOD_TYPES`.

```sh
ilspycmd -p -o decomp ".../Managed/Assembly-CSharp.dll"
python extract-food-calories.py     # expects ./decomp alongside it
```

Two shapes in the table are not plain numbers, and both are resolved rather
than guessed: nine ids are written `SomeConfig.ID` and are read out of that
config class, and Pemmican computes its calories from Hardskin Berry's.
Anything unresolvable is reported and nothing is written.

Eight foods come out at zero calories - Nori, Caviar and Fern Food among them.
That is the game's own value, not a failure to read one: `FoodInfo.Display` is
`CaloriesPerUnit != 0f`, which is how the game hides them.

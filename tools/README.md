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

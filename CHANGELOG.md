## 3.27.0

- The Effects tab shows real names instead of raw ids - "Sore Back" and "Mess
  Hall" rather than `SoreBack` and `RoomMessHall`. Both the table and the add
  dialog looked up a placeholder translation key that had never existed.
- The add list goes from 33 effects to 92. The old list was largely wrong: only
  5 of its 33 appear on a duplicant in any real save, while 48 that duplicants
  do carry - every Decor and Edible tier, the room bonuses - were missing.
- Effects sort by name, matching the other tabs.

## 3.26.2

- Fix the Raw Editor showing the wrong node. Selecting anything nested - a
  game object's `position`, say - edited its outermost ancestor instead,
  because the click bubbled through every enclosing tree item and the last
  handler to run won. The editor pane looked empty because that ancestor had
  no editable fields of its own.

## 3.26.1

- The Geysers page says why it is empty instead of rendering nothing. A colony
  can legitimately have no geysers, and an Aquatic Planet Pack one can have
  Tidal Springs and Thermal Gas Fissures, which are their own prefabs and store
  no emission settings to edit. Both cases previously showed a blank page.

## 3.26.0

- New "Make Mega Duplicant" action, in the duplicant list's overflow menu and
  on the editor page. It maxes every attribute to 9999, replaces the
  duplicant's traits with the good ones, takes every interest, and sets
  experience to 999999.
- The editor page now carries the same overflow menu as the list, so Copy,
  Paste, Import, Export and Clone are reachable there too.

Two notes on what "the good ones" means. It is the game's own `positiveTrait`
flag, which covers 29 traits and excludes the joy and stress reactions. And
three of those 29 conflict in pairs - Early Bird with Night Owl, Shriveled
Tastebuds with Gourmet, Uncultured with Interior Decorator - so one of each
pair is taken rather than both, which would leave a duplicant the game rejects.

## 3.25.0

- The Skills tab now offers the right skills for the save. It listed a fixed
  32, so the Aquatic Planet Pack's Basic Swimming and Divemaster were missing
  entirely, and so were the ten Bionic Booster Pack skills.
- Skills are filtered by the save's active content packs and by the duplicant's
  model, matching the game: a standard duplicant in a five-pack save sees 44,
  and a bionic one sees its own ten and nothing else.
- Skills show their real names - "Hazmat Digging" rather than `Mining4`.

## 3.24.0

- Rework the Attributes tab. Values were clipped inside fixed 50px fields,
  left-aligned against their labels, and would have overflowed on anything
  wider than two digits. Fields are now sized from their value, so a six-digit
  level fits, and the value is centred.
- Attributes sort by name. They had followed a hand-written array order, which
  read as random once the labels differ from the ids - `Digging` shows as
  "Excavation", `Ranching` as "Husbandry".
- The list is a responsive grid instead of a fixed-height column wrap, which
  had spread items into columns with large gaps and could not reflow. Long
  labels ellipsise rather than wrapping onto three lines.

## 3.23.0

- Trait tooltips now say what the trait actually does, not just its flavour
  text. Rock Fan reads "During meteor showers: +3 bonus to all Attributes";
  Unpracticed Artist reads "Creativity: -3" and "Decor Morale Bonus: +5";
  Trypophobia reads "Cannot do Digging Errands".
- 105 of 146 traits carry effect lines. The rest are implemented purely as
  behaviour and have nothing a line can state.

The numbers are not in the game's string table - the game builds them at
runtime from each trait's data - so they are extracted from the assembly by
`tools/extract-trait-effects.py`, which is re-runnable when the game updates.

## 3.22.0

- Add the missing "Pilot" interest. Rocketry arrived with Spaced Out! and was
  never added to the skill-group list, so a duplicant's aptitude in it was
  invisible and could not be granted.
- Interests show their real names instead of raw ids. Both the chips and the
  add menu looked up translation keys that did not exist - and two different
  ones at that - so every interest fell back to its id. They now read "Digger",
  "Doctor", "Pilot" rather than "Mining", "MedicalAid", "Rocketry".
- Interests sort by name, matching the traits change in 3.21.0.

## 3.21.0

- Sort traits by name everywhere they are listed. The add-trait menu did sort,
  but on the trait id rather than the label, which is not the same order: the
  id `Aggressive` displays as "Destructive" and `ConstructionUp` as "Handy", so
  entries landed under the wrong letter. Trait chips and the duplicant list
  followed save order, which is arbitrary. All three now collate by the
  displayed name in the active language.

## 3.20.0

Brings the editor up to date with the content packs released since Spaced Out!.

- Detect active content packs correctly. The header has recorded them three
  different ways over the game's life, and the editor only understood the
  oldest, so on every save since July 2024 it saw no DLC at all. Reads the
  modern `dlcIds` array, falls back to the legacy `dlcId` string, and treats
  the result as a set.
- Recognise Frosty Planet Pack, Bionic Booster Pack, Prehistoric Planet Pack
  and Aquatic Planet Pack alongside Spaced Out!, and show one chip per active
  pack.
- Geysers page now lists all 27 generic geyser types, up from 19. The 8 new
  types were missing entirely, so DLC geysers such as the Cool Chlorine Gas
  Vent were invisible and could not be edited.
- Trait editor now knows 146 traits, up from 59. DLC traits previously showed
  as raw ids and, once removed from a duplicant, could never be added back.
  Trait and attribute names now come from the game's own string table.
- New Worlds page for Spaced Out! saves, listing every asteroid in the cluster
  with its name, discovery and visit state, sunlight and cosmic radiation.
- Removed the Planets page. It edited the pre-Spaced Out! starmap, which no
  longer exists - the underlying data is null in every DLC save.
- Re-enabled the Materials page and added Creatures to the navigation.
- Creatures page lists 52 critters, up from 3.
- Bionic duplicants are listed, edited and cloned. Duplicant pages no longer
  assume `Minion` is the only duplicant prefab, and cloning now returns the
  copy to whichever group the original came from.
- Portraits show a placeholder instead of a headless duplicant. The bundled
  sprites predate several packs, and duplicants now routinely use parts past
  the highest asset available - a bionic one here wants hair_035 against a
  maximum of hair_033.
- Overview shows duplicant count, cluster and save version.
- Replaced the dev fixture behind `loadMockSave()`. The old one was a 7.8 base
  game save that exercised none of this; the new one is a five-pack 7.38
  cluster with a bionic duplicant, two asteroids and a DLC geyser, and is a
  third of the size.
- Dropped the "no longer supported, may corrupt saves" banner, and clarified
  the unrecognised-version message.

## 3.19.0

- Hack out nonfunctional editors that no longer apply to save version 4.31

## 3.18.1

- Fix crash when encountering invalid hairstyles.

## 3.18.0

- Make save editor DLC-aware
- Enable planets editor for non-dlc saves.

## 3.17.0

- Support save version 4.25
- Allow bypassing version check.

## 3.16.2

- Support DLC save version 4.23

## 3.16.1

- Support save file 4.17 as well as 4.22

## 3.16.0

- Support save file 4.22
- Disable planets editor for now; it is incompatible with 4.22.

## 3.15.3

- Commit text field changes when navigating away from the page.
- Support save file version 7.17

## 3.15.2

- Support save file version 7.16 (Automation Pack)

## 3.15.1

- Fix incorrect site configuration preventing loading or saving files.

## 3.15.0

- Added offline support, can be enabled through settings.

## 3.14.0

- Allow changing geyser year, active, and emission length.
- Make geyser text translatable.
- Add ability to delete individual loose materials.
- Add ability to search material list.

## 3.13.1

- Update oni-save-parser: Open up restrictions on .NET name validator to support mods with symbols or unicode in property names.

## 3.13.0

- Add planet recoverable element mass editing.

## 3.12.0

- Add traits from Recreation Pack

## 3.11.0

- Toggle inner sandbox mode flag when sandbox difficulty is changed. Possible fix for sandbox mode not changing with difficulty setting.
- Switch to supporting Recreation Pack update.

## 3.10.0

- Improved raw editor - Tree view and field inputs.
- Fix Czech and spanish translations not working.

## 3.9.0

- Fix geyser sliders latching to 0 or 100%.
- Fix UI lag when choosing slider values.
- Add missing traits Allergies and Archaeologist.
- Add Spanish translations, contributed by Galo223344.
- Add Czech translations, contributed by sorashi.
- Fix unable to save if a file is loaded after the example is loaded. Contributed by ferrybig.

## 3.8.5

- Update parser to support save version 7.12

## 3.8.4

- Change arm color with body.
- Update parser for salt water geyser support.
- Fix parsing certain modded fields such as "<Threshold>k\_\_BackingField".
- Fix duplicant clones sharing ownership with their original (Fixes bed sharing).

## 3.8.3

- Update for LU support.

## 3.8.2

- Fix selecting multiple categories to copy/export.
- Persist language selection.
- Show status dialog when saving.

## v3.8.1

- Fix crash on saves with active mods.

## v3.8.0

- Support new QOL3 changes. Breaks compatibility with older saves.
- Fix interests selection in QOL3.

## v3.7.0

- Raw JSON editor

## v3.6.0

- Editor for various difficulty settings.
- Fix geyser rate modification.
- Support saves from 7.6 to 7.8

## v3.5.0

- Change geyser game object type (and artwork) when changing emit element.
- Improve load/save performance.
- "Delete Loose Material" - Option to delete all loose ores on map.

## v3.4.0

- Back button for sub-pages
- Redirect to home page if no save is loaded
- Redirect to home page on 404.
- Materials list
- Imporove "Add Trait/Interest" UI.
- Geysers list
- Basic geyser element and rate editing.
- Duplicant data import / export.
- Fix Tinker and Toggle primary / secondary attribute classification being swapped.

## v3.3.1

- Fix deleting interests

## v3.3.0

- Copy / Paste Duplicant settings.
- Clone Duplicant.

## v3.2.0

- Fix Body Appearance tab.
- Add in-game names for aptitudes and traits

## v3.1.0

- Fill in duplicant property editors.

## v3.0.1

- Fix saves not loading

## v3.0.0

- Rewrite of UI focusing on reusability

## v2.1.3

- Update oni-save-parser to bring in missing traits.

## v2.1.2

- Fix spelling of stamina (#37)
- More flexible type system for identifying save elements to edit.
- Rocketry update supprt.

## v2.1.1

- The same fix to numeric input, preventing editing of some values.
- Chinese language support contributed by [@zsnmwy](https://github.com/zsnmwy)

## v2.1.0

- Fixes to numeric input preventing editing of some values
- Geyser editing (type, rate, lifecycle values)

## v2.0.5

- Fix decimal values not editable.
- Stylistic improvements to tables.

## v2.0.4

- Fix numeric values not editable in browsers other than chrome.

## v2.0.3

- Really remove test button from production build...

## v2.0.2

- Remove test button from production build.

## v2.0.1

- Fix incorrect url path preventing website from loading.

## v2.0.0

Major rewrite of save editor.

- Ground-up rewrite of UI.
- Save / Load progress reporting.
- Edit any recognized template object
- extraData editors duplicant modifiers (health, stamina, germs, diseases, ...)
- extraData editor for storage
- Additional editors for minion modifiers

## v1.4.3

Fix all job mastery and experiences displayed as unmastered / 0.

## v1.4.2

Wallpaper over more bugs due to oni-save-parser@2 save object differences.

## v1.4.1

Slash and burn conversion to support oni-save-parser@2 and the Cosmic Update version of ONI (save version 7.4).

## v1.4.0

- Edit duplicant
  - Interests (aptitudes)
- Edit geysers
  - Type
  - Cycle time factor
  - Active time factor
  - Dormant time factor
- Ability to rename file on download.

## v1.3.0

- Edit current cycle.
- Edit duplicant printer
  - Next duplicant ready
  - Time to next duplicant

## v1.2.1

- Fix save corruption when text with multi-byte accents are encountered.
- Refactor URL layout to make way for future utilities.

## v1.2.0

- Edit Duplicants
  - Current Job
  - Target Job
  - Job Experience
  - Job Mastery

## v1.1.0

- Edit Duplicants
  - Gender (data only; no visual effect)
  - Voice
  - Appearance
- Dedicated load button (no more refreshes to edit new saves)

## v1.0.0

Ground-up rewrite.

- Edit Duplicants
  - Name
  - Size (width and height)
  - Health Status (healthy, critical, incapacitated, invulnurable, ...)
  - Skills (level and experience)
  - Traits
  - Status Effects
- New Theme
- Non-blocking file loading and saving. Prevents browsers from killing the process when working with large saves.
- Internal cleanup for mantainability going forward.

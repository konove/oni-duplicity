# Duplicity (V3)

A web-based Oxygen Not Included save editor.

You can find the editor at [https://robophred.github.io/oni-duplicity](https://robophred.github.io/oni-duplicity).

The saved files are located in:

MAC: `~/Library/Application Support/unity.Klei.Oxygen Not Included/save_files/`

Windows: `C:\Users\Your users name\Documents\Klei\OxygenNotIncluded\save_files\`

# Compatibility

Supports save versions 7.28, 7.31, 7.32, 7.34, 7.36 and 7.38, covering the base game and every content pack through the Aquatic Planet Pack: Spaced Out!, Frosty Planet Pack, Bionic Booster Pack, Prehistoric Planet Pack and Aquatic Planet Pack.

Saves describe their own structure, so a new game version that only adds or reorders fields usually reads fine. The editor still refuses unrecognised versions by default and offers an explicit override, because "usually" is not "always". Older saves may need re-saving in a current version of the game first.

**Back up any save before editing it.** Loading and writing a save here does not prove the game will accept the result.

# V3

This branch is a rewrite of the UI focusing on ease of use and community requested features.

# Translations

This project is ready for translations.

To contribute a translation, translate [/src/translations/en/common.json](src/translations/en/common.json) and [/src/translations/en/oni.json](src/translations/en/oni.json) and submit them in a new issue.

# Implementation

The actual save serialization is done by the [oni-save-parser](https://github.com/RoboPhred/oni-save-parser) library. Feel free to use this library in your own projects.

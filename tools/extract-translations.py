"""Builds a language's oni.json from the game's own string table.

The DUPLICANTS strings in src/translations/<lang>/oni.json are Klei's, not
ours: a save editor has to call a trait what the player's game calls it. The
game ships its preinstalled translations as gettext catalogues:

    OxygenNotIncluded_Data/StreamingAssets/strings/strings_preinstalled_<lang>_klei.po

Each entry's msgctxt is the string's full path - "STRINGS.DUPLICANTS.TRAITS.
AGGRESSIVE.NAME". Three of our groups line up with that directly once the id is
upper-cased; two do not, and are matched on their English text instead:

    TRAITS       STRINGS.DUPLICANTS.TRAITS.<ID>            by id
    ATTRIBUTES   STRINGS.DUPLICANTS.ATTRIBUTES.<ID>        by id
    SKILLGROUPS  STRINGS.DUPLICANTS.SKILLGROUPS.<ID>       by id
    EFFECTS      STRINGS.DUPLICANTS.MODIFIERS.<ID>         by id
    SKILLS       STRINGS.DUPLICANTS.ROLES.<?>.NAME         by English name

Only SKILLS needs the English name. The game has no SKILLS string group, and our
ids come from the assembly (extract-skills.py), where skill "Mining1" is role
"Hard Digging" - there is nothing else to join on. That match is checked for
ambiguity: if two catalogue entries share an English name and disagree in the
target language, the entry is skipped rather than guessed.

Effects are matched by id rather than by name for exactly that reason. Two
distinct effects, ExpellingGunk and StressfulyEmptyingBladder, are both "Making
a mess" in English; Korean gives them different words. Matching on the English
would have had to discard both.

CHOREGROUPS is deliberately not used for SKILLGROUPS. It looks like a match and
is not: chore group ART is "Decorating" where skill group ART is "Decorator".

DLC pack names are not in the catalogue - they are brand names and stay English.

Usage:

    python extract-translations.py ru "C:/Steam/steamapps/common/OxygenNotIncluded"

Only keys that already exist in en/oni.json are emitted, and only where the
catalogue has a non-empty translation; anything else is left out so i18next
falls back to English per key rather than showing a blank.

The game's strings carry markup that en/oni.json does not (<link="POLLENGERMS">,
<style="KKeyword">, literal newlines). normalize() strips it. That function is
checked on every run against the catalogue's own msgid values: they must
reproduce en/oni.json exactly, or the extraction stops. If a game update changes
how strings are marked up, that check fails rather than quietly writing
differently-formatted Russian.
"""

import io
import json
import os
import re
import sys
from collections import OrderedDict

TAG = re.compile(r'</?(?:link|style|b|i|color|size|sprite)(?:=[^>]*)?>', re.I)


def normalize(s):
    """Strip game markup the way en/oni.json is stripped."""
    s = TAG.sub("", s)
    s = s.replace("\n", "\n").replace("\n", " ")
    return re.sub(r"[ \t]+", " ", s).strip()


def parse_po(path):
    """msgctxt -> (msgid, msgstr), joining continuation lines."""
    entries = {}
    ctxt = msgid = msgstr = None
    field = None

    def flush():
        if ctxt is not None:
            entries[ctxt] = (msgid or "", msgstr or "")

    with io.open(path, encoding="utf-8") as handle:
        for raw in handle:
            line = raw.rstrip("\n")
            if line.startswith("msgctxt "):
                flush()
                ctxt, msgid, msgstr, field = json.loads(line[8:]), "", "", "ctxt"
            elif line.startswith("msgid "):
                msgid, field = json.loads(line[6:]), "id"
            elif line.startswith("msgstr "):
                msgstr, field = json.loads(line[7:]), "str"
            elif line.startswith('"') and field:
                part = json.loads(line)
                if field == "id":
                    msgid += part
                elif field == "str":
                    msgstr += part
                else:
                    ctxt += part
            elif not line.strip():
                field = None
    flush()
    return entries


ID_GROUPS = {
    "TRAITS": "TRAITS",
    "ATTRIBUTES": "ATTRIBUTES",
    "SKILLGROUPS": "SKILLGROUPS",
    "EFFECTS": "MODIFIERS",
    "ELEMENTS": "ELEMENTS",
}
NAME_GROUPS = {"SKILLS": "ROLES"}


def name_index(po, catalogue_group):
    """English name -> set of translations, for one catalogue group."""
    index = {}
    pattern = re.compile(r"STRINGS\.DUPLICANTS\.%s\.[A-Z0-9_]+\.NAME$" % catalogue_group)
    for key, (msgid, msgstr) in po.items():
        if pattern.match(key) and msgstr.strip():
            index.setdefault(normalize(msgid), set()).add(normalize(msgstr))
    return index


SIM_HASHES = os.path.join(
    "node_modules", "oni-save-parser", "dts", "save-structure", "const-data",
    "template-enumerations", "sim-hashes.d.ts")


def sim_hash_names(repo_root):
    """The material ids a save can hold, from the parser's SimHashes enum."""
    path = os.path.join(repo_root, SIM_HASHES)
    text = io.open(path, encoding="utf-8").read()
    return re.findall(r"^\s{4}([A-Za-z][A-Za-z0-9_]*)\s*=", text, re.M)


def elements_group(po, names, english):
    """ELEMENTS entries for every material id, from the catalogue."""
    out = OrderedDict()
    for name in names:
        entry = po.get("STRINGS.ELEMENTS.%s.NAME" % name.upper())
        if not entry:
            continue
        value = entry[0] if english else entry[1]
        if value.strip():
            out[name] = OrderedDict([("NAME", normalize(value))])
    return out


# The custom-game settings the editor exposes, mapped to their catalogue
# segment. The names differ: the save calls it CalorieBurn, the game
# CALORIE_BURN.
DIFFICULTY_SETTINGS = {
    "ImmuneSystem": "IMMUNESYSTEM",
    "Stress": "STRESS",
    "StressBreaks": "STRESS_BREAKS",
    "Morale": "MORALE",
    "CalorieBurn": "CALORIE_BURN",
    "SandboxMode": "SANDBOXMODE",
}
SETTINGS_ROOT = "STRINGS.UI.FRONTEND.CUSTOMGAMESETTINGSSCREEN.SETTINGS"


def difficulty_group(po, english):
    """The difficulty settings and their levels, as the game labels them."""
    out = OrderedDict()
    for setting, segment in DIFFICULTY_SETTINGS.items():
        entries = OrderedDict()

        name = po.get("%s.%s.NAME" % (SETTINGS_ROOT, segment))
        if name:
            value = name[0] if english else name[1]
            if value.strip():
                entries["NAME"] = normalize(value)

        # Levels are discovered rather than listed, so a new difficulty option
        # in a game update comes through without editing this file.
        prefix = "%s.%s.LEVELS." % (SETTINGS_ROOT, segment)
        for key, (msgid, msgstr) in po.items():
            if not key.startswith(prefix) or not key.endswith(".NAME"):
                continue
            level = key[len(prefix):-len(".NAME")]
            value = msgid if english else msgstr
            # Keyed by the catalogue's own upper-case level, so the app looks
            # up value.toUpperCase() rather than anyone guessing that VERYHARD
            # pairs with the save's "VeryHard".
            if value.strip():
                entries[level] = normalize(value)

        if entries:
            out[setting] = entries
    return out


GEYSER_ROOT = "STRINGS.CREATURES.SPECIES.GEYSER"


def geysers_group(po, types, english):
    """Geyser display names, keyed by the parser's lower-case type."""
    out = OrderedDict()
    for geyser_type in types:
        entry = po.get("%s.%s.NAME" % (GEYSER_ROOT, geyser_type.upper()))
        if not entry:
            continue
        value = entry[0] if english else entry[1]
        if value.strip():
            out[geyser_type] = OrderedDict([("NAME", normalize(value))])
    return out


GEYSER_TYPES_SOURCE = os.path.join(
    "node_modules", "oni-save-parser", "dts", "save-structure", "const-data",
    "geysers", "geyser-type.d.ts")


def geyser_type_names(repo_root):
    """The geyser types the parser models, from its own enum."""
    path = os.path.join(repo_root, GEYSER_TYPES_SOURCE)
    text = io.open(path, encoding="utf-8").read()
    # It is a readonly tuple of string literals, not an enum:
    #   export declare const GeyserTypeNames: readonly ["steam", "hot_steam", ...
    match = re.search(r"GeyserTypeNames:\s*readonly \[([^\]]*)\]", text)
    if not match:
        return []
    return re.findall(r'"([a-z0-9_]+)"', match.group(1))


def build(en, po, stats):
    """Mirror en/oni.json's shape, keeping only translated leaves."""
    out = OrderedDict()
    duplicants = OrderedDict()

    for group, leaves in en.get("DUPLICANTS", {}).items():
        translated = OrderedDict()

        if group in ID_GROUPS:
            catalogue = ID_GROUPS[group]
            for ident, fields in leaves.items():
                kept = OrderedDict()
                for leaf, value in fields.items():
                    if not isinstance(value, str) or not value:
                        continue
                    stats["total"] += 1
                    entry = po.get("STRINGS.DUPLICANTS.%s.%s.%s"
                                   % (catalogue, ident.upper(), leaf))
                    if entry and entry[1].strip():
                        kept[leaf] = normalize(entry[1])
                        stats["translated"] += 1
                if kept:
                    translated[ident] = kept

        elif group in NAME_GROUPS:
            index = name_index(po, NAME_GROUPS[group])
            for ident, fields in leaves.items():
                english = fields.get("NAME")
                if not isinstance(english, str) or not english:
                    continue
                stats["total"] += 1
                candidates = index.get(normalize(english))
                if not candidates:
                    continue
                if len(candidates) > 1:
                    stats["ambiguous"] += 1
                    continue
                translated[ident] = OrderedDict([("NAME", candidates.pop())])
                stats["translated"] += 1

        if translated:
            duplicants[group] = translated

    if duplicants:
        out["DUPLICANTS"] = duplicants
    return out


def main():
    if len(sys.argv) != 3:
        sys.exit("usage: extract-translations.py <lang> <path to OxygenNotIncluded>")
    lang, game = sys.argv[1], sys.argv[2]

    strings = os.path.join(game, "OxygenNotIncluded_Data", "StreamingAssets", "strings")
    # English is not a translation: it is the template every catalogue is built
    # from, so its text lives in the msgid rather than a msgstr.
    po_path = os.path.join(strings, "strings_template.pot" if lang == "en"
                           else "strings_preinstalled_%s_klei.po" % lang)
    if not os.path.exists(po_path):
        sys.exit("no preinstalled catalogue for %r at %s" % (lang, po_path))

    here = os.path.dirname(os.path.abspath(__file__))
    en_path = os.path.join(here, "..", "src", "translations", "en", "oni.json")
    en = json.load(io.open(en_path, encoding="utf-8"), object_pairs_hook=OrderedDict)
    po = parse_po(po_path)

    # normalize() must reproduce en/oni.json from the catalogue's own English.
    checked = mismatched = 0
    for group, catalogue in ID_GROUPS.items():
        for ident, fields in en.get("DUPLICANTS", {}).get(group, {}).items():
            for leaf, value in fields.items():
                if not isinstance(value, str) or not value:
                    continue
                entry = po.get("STRINGS.DUPLICANTS.%s.%s.%s" % (catalogue, ident.upper(), leaf))
                if not entry:
                    continue
                checked += 1
                if normalize(entry[0]) != normalize(value):
                    mismatched += 1
                    if mismatched <= 3:
                        print("  mismatch at DUPLICANTS.%s.%s.%s"
                              + "\n    en/oni.json: %r"
                              + "\n    catalogue:   %r"
                              % (group, ident, leaf, normalize(value)[:100], normalize(entry[0])[:100]))
    print("markup check: %d/%d catalogue msgids reproduce en/oni.json" % (checked - mismatched, checked))
    if mismatched:
        sys.exit("normalize() no longer matches how en/oni.json was built - fix it before trusting the output")

    # en/oni.json is generated by the other tools in here and has no ELEMENTS
    # group of its own; seed it from the catalogue's English before translating.
    repo_root = os.path.join(here, "..")
    names = sim_hash_names(repo_root)
    if lang == "en":
        en.setdefault("DUPLICANTS", OrderedDict())
        en["ELEMENTS"] = elements_group(po, names, english=True)
        en["DIFFICULTY"] = difficulty_group(po, english=True)
        en["GEYSERS"] = geysers_group(po, geyser_type_names(repo_root), english=True)
        io.open(en_path, "w", encoding="utf-8", newline="\n").write(
            json.dumps(en, ensure_ascii=False, indent=2) + "\n")
        print("seeded en/oni.json with %d element names and %d difficulty settings"
              % (len(en["ELEMENTS"]), len(en["DIFFICULTY"])))
        print("  plus %d geyser names" % len(en["GEYSERS"]))
        return

    stats = {"total": 0, "translated": 0, "ambiguous": 0}
    result = build(en, po, stats)
    result["ELEMENTS"] = elements_group(po, names, english=False)
    result["DIFFICULTY"] = difficulty_group(po, english=False)
    result["GEYSERS"] = geysers_group(po, geyser_type_names(repo_root), english=False)
    stats["total"] += len(names)
    stats["translated"] += len(result["ELEMENTS"])
    out_path = os.path.join(here, "..", "src", "translations", lang, "oni.json")

    # Anything already translated that the catalogue does not cover is kept.
    # The older files here were contributed by hand and still carry entries the
    # game has since dropped from its string table.
    kept = 0
    if os.path.exists(out_path):
        existing = json.load(io.open(out_path, encoding="utf-8"),
                             object_pairs_hook=OrderedDict)
        for group, idents in existing.get("DUPLICANTS", {}).items():
            target = result.setdefault("DUPLICANTS", OrderedDict()).setdefault(
                group, OrderedDict())
            for ident, fields in idents.items():
                for leaf, value in fields.items():
                    if leaf not in target.get(ident, {}):
                        target.setdefault(ident, OrderedDict())[leaf] = value
                        kept += 1
    if kept:
        print("kept %d existing string(s) the catalogue does not cover" % kept)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    io.open(out_path, "w", encoding="utf-8", newline="\n").write(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print("wrote %s: %d of %d strings translated, %d left to fall back to English"
          % (out_path, stats["translated"], stats["total"], stats["total"] - stats["translated"]))
    if stats["ambiguous"]:
        print("  %d skipped: English name matched more than one catalogue entry"
              % stats["ambiguous"])


if __name__ == "__main__":
    main()

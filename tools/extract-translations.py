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
    SKILLS       STRINGS.DUPLICANTS.ROLES.<?>.NAME         by English name
    EFFECTS      STRINGS.DUPLICANTS.MODIFIERS.<?>.NAME     by English name

The game has no SKILLS or EFFECTS string group at all. Our ids for those come
from the assembly (extract-skills.py, extract-effect-ids.py) and look nothing
like the catalogue's - skill "Mining1" is role "Hard Digging" - so the English
name is the only join available. It is checked for ambiguity: if two catalogue
entries share an English name and disagree in the target language, the entry is
skipped rather than guessed. Today that never happens; all 54 skills and 82
effects resolve uniquely.

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


ID_GROUPS = {"TRAITS": "TRAITS", "ATTRIBUTES": "ATTRIBUTES", "SKILLGROUPS": "SKILLGROUPS"}
NAME_GROUPS = {"SKILLS": "ROLES", "EFFECTS": "MODIFIERS"}


def name_index(po, catalogue_group):
    """English name -> set of translations, for one catalogue group."""
    index = {}
    pattern = re.compile(r"STRINGS\.DUPLICANTS\.%s\.[A-Z0-9_]+\.NAME$" % catalogue_group)
    for key, (msgid, msgstr) in po.items():
        if pattern.match(key) and msgstr.strip():
            index.setdefault(normalize(msgid), set()).add(normalize(msgstr))
    return index


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

    po_path = os.path.join(
        game, "OxygenNotIncluded_Data", "StreamingAssets", "strings",
        "strings_preinstalled_%s_klei.po" % lang)
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

    stats = {"total": 0, "translated": 0, "ambiguous": 0}
    result = build(en, po, stats)
    out_path = os.path.join(here, "..", "src", "translations", lang, "oni.json")
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

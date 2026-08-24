#!/usr/bin/env python3
"""Maps every non-element material prefab to the catalogue key the game names
it with, and writes ./item-name-keys.json for extract-translations.py.

The Materials page lists seeds, eggs, food, equipment and loose items as well
as elements. Elements are easy - the catalogue key is derivable, `ELEMENTS.<id>
.NAME` - but items are not: each config class picks its own key, so
`GardenForagePlantConfig` names itself `STRINGS.ITEMS.FOOD.GARDENFORAGEPLANT
.NAME` and there is no rule connecting the two. Splitting the id instead gives
"Garden Forage Plant" for something the game calls **Snac Fruit**, and
"Garden Food Plant Food" for **Sweatcorn**.

The pairing rule is one observation about the game's entity helpers: the
display name is always the argument straight after the prefab id.

    CreateLooseEntity("GardenForagePlant", STRINGS.ITEMS.FOOD.GARDENFORAGEPLANT.NAME, ...)
    CreateAndRegisterSeedForPlant(plant, this, type, "GardenFoodPlantSeed", name, desc, ...)
    ExtendEntityToFertileCreature(prefab, this, "CrabEgg", STRINGS.CREATURES.SPECIES.CRAB.EGG_NAME, ...)

So this does not need to know any helper's signature. It scans every call,
resolves each argument that can be resolved - string literals, `SomeConfig.ID`
constants, and local `string name = STRINGS...` variables - and records a pair
wherever a prefab id is followed by a catalogue key.

Equipment is the one exception and is handled by convention: `CreateEquipmentDef`
takes no name, and the game looks the suit up as `EQUIPMENT.PREFABS.<ID>.NAME`.

Needs the same decompiled source as the other extractors:

    ilspycmd -p -o decomp ".../Managed/Assembly-CSharp.dll"
    python extract-item-names.py

Every key is checked against the game's own string template before anything is
written; a prefab that resolves to two different keys is reported and dropped,
because a wrong name labels a material as some other material, which is worse
than showing the id.
"""

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DECOMP = HERE / "decomp"
OUT = HERE / "item-name-keys.json"

DEFAULT_GAME = "C:/Steam/steamapps/common/OxygenNotIncluded"
POT_RELATIVE = "OxygenNotIncluded_Data/StreamingAssets/strings/strings_template.pot"

# `public const string ID = "GardenForagePlant";`, and the static form some
# configs use instead.
CONST_STRING = re.compile(
    r"public\s+(?:const|static(?:\s+readonly)?)\s+string\s+([A-Za-z_][A-Za-z0-9_]*)"
    r"\s*=\s*\"([^\"]*)\"\s*;"
)
# `string name = STRINGS.CREATURES.SPECIES.SEEDS.GARDENFOODPLANT.NAME;`
LOCAL_KEY = re.compile(
    r"\bstring\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(STRINGS\.[A-Za-z0-9_.]+)\s*;"
)
LOCAL_LITERAL = re.compile(
    r"\bstring\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\"([^\"]*)\"\s*;"
)
CALL = re.compile(r"\b([A-Za-z_][A-Za-z0-9_]*)\s*\(")
# Half the configs write `STRINGS.ITEMS.FOOD.X.NAME` and half write
# `ITEMS.FOOD.X.NAME`, because the file has `using STRINGS;`. Both are the same
# key; the bare form is normalised below, and every key is checked against the
# game's own template afterwards, so a false positive is dropped rather than
# believed.
STRINGS_KEY = re.compile(r"^(?:STRINGS\.)?[A-Z][A-Z0-9_]*(?:\.[A-Za-z0-9_]+)+$")
# A prefab id: no spaces or punctuation beyond the underscore ONI uses.
PREFAB_ID = re.compile(r"^[A-Za-z][A-Za-z0-9_]*$")
# `.NAME`, `.EGG_NAME` - the leaves that hold a display name.
NAME_LEAF = re.compile(r"\.(?:[A-Z0-9_]*_)?NAME$")

EQUIPMENT_DEF = "CreateEquipmentDef"


def split_args(text: str, open_paren: int):
    """Top-level arguments of the call whose `(` is at `open_paren`.

    Returns (args, index just past the `)`), or (None, ...) if unbalanced.
    """
    depth = 0
    args = []
    current = []
    i = open_paren
    in_string = False
    escape = False

    while i < len(text):
        c = text[i]
        if in_string:
            current.append(c)
            if escape:
                escape = False
            elif c == "\\":
                escape = True
            elif c == '"':
                in_string = False
            i += 1
            continue

        if c == '"':
            in_string = True
            current.append(c)
        elif c in "([{":
            depth += 1
            if depth > 1:
                current.append(c)
        elif c in ")]}":
            depth -= 1
            if depth == 0:
                args.append("".join(current).strip())
                return args, i + 1
            current.append(c)
        elif c == "," and depth == 1:
            args.append("".join(current).strip())
            current = []
        else:
            current.append(c)
        i += 1

    return None, len(text)


def normalise_key(key):
    """`ITEMS.FOOD.X.NAME` and `STRINGS.ITEMS.FOOD.X.NAME` are the same key."""
    return key if key.startswith("STRINGS.") else f"STRINGS.{key}"


def collect_constants(files):
    """`ClassName.CONST` -> its string value, across the whole decompile."""
    constants = {}
    for path in files:
        class_name = path.stem
        for match in CONST_STRING.finditer(path.read_text(encoding="utf-8", errors="replace")):
            constants[f"{class_name}.{match.group(1)}"] = match.group(2)
    return constants


def resolve(expression, locals_, constants):
    """An argument as either a plain string or a catalogue key, or None."""
    expression = expression.strip()
    if not expression:
        return None

    if expression.startswith('"') and expression.endswith('"') and len(expression) >= 2:
        return expression[1:-1]

    if STRINGS_KEY.match(expression):
        return normalise_key(expression)

    if expression in locals_:
        return locals_[expression]

    if expression in constants:
        return constants[expression]

    return None


def pairs_in(path, constants):
    """(prefab id, catalogue key) pairs this file declares."""
    text = path.read_text(encoding="utf-8", errors="replace")

    locals_ = {}
    for match in LOCAL_KEY.finditer(text):
        locals_.setdefault(match.group(1), match.group(2))
    for match in LOCAL_LITERAL.finditer(text):
        locals_.setdefault(match.group(1), match.group(2))
    # A file's own `ID` is usually written bare inside its Configure method.
    for name in ("ID", "SEED_ID", "EGG_ID"):
        key = f"{path.stem}.{name}"
        if key in constants:
            locals_.setdefault(name, constants[key])

    found = []
    for call in CALL.finditer(text):
        helper = call.group(1)
        args, _ = split_args(text, call.end() - 1)
        if args is None:
            continue

        if helper == EQUIPMENT_DEF and args:
            # No name argument; the game looks equipment up by convention.
            equipment_id = resolve(args[0], locals_, constants)
            if equipment_id and PREFAB_ID.match(equipment_id):
                found.append(
                    (equipment_id, f"STRINGS.EQUIPMENT.PREFABS.{equipment_id.upper()}.NAME")
                )
            continue

        for index in range(len(args) - 1):
            prefab = resolve(args[index], locals_, constants)
            name = resolve(args[index + 1], locals_, constants)
            if not prefab or not name:
                continue
            if not PREFAB_ID.match(prefab) or not STRINGS_KEY.match(name):
                continue
            if not NAME_LEAF.search(name):
                continue
            found.append((prefab, name))

    return found


def catalogue_keys(game_root):
    """Every msgctxt in the game's string template."""
    pot = Path(game_root) / POT_RELATIVE
    if not pot.is_file():
        raise SystemExit(f"no string template at {pot}")
    return {
        match.group(1)
        for match in re.finditer(
            r'^msgctxt "([^"]+)"$', pot.read_text(encoding="utf-8"), re.M
        )
    }


def main() -> None:
    if not DECOMP.is_dir():
        raise SystemExit(
            f"no decompiled source at {DECOMP}\n"
            "run: ilspycmd -p -o decomp '.../Managed/Assembly-CSharp.dll'"
        )

    game_root = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_GAME
    known = catalogue_keys(game_root)

    # Constants come from everywhere, because a config can reference another
    # class's ID; pairs come only from entity configs. Scanning the whole
    # assembly for pairs matches any `("Happy", SOMETHING.NAME)` in a status
    # item or a chore, which is 1,700 entries of noise around the 500 real ones
    # and risks one of them colliding with a real prefab id.
    all_files = sorted(DECOMP.rglob("*.cs"))
    config_files = [p for p in all_files if p.stem.endswith("Config")]
    print(f"scanning {len(config_files)} entity configs of {len(all_files)} files")
    constants = collect_constants(all_files)
    print(f"  {len(constants)} string constants")

    by_prefab = {}
    conflicts = set()
    for path in config_files:
        for prefab, key in pairs_in(path, constants):
            existing = by_prefab.get(prefab)
            if existing is None:
                by_prefab[prefab] = key
            elif existing != key:
                conflicts.add(prefab)

    for prefab in conflicts:
        by_prefab.pop(prefab, None)

    # Artifacts build their prefab id at runtime - `CreateArtifact` does
    # `"artifact_" + id.ToLower()` - so the pair above records the bare id. The
    # save stores the built one.
    for prefab, key in list(by_prefab.items()):
        if ".SPACEARTIFACTS." in key:
            by_prefab.setdefault(f"artifact_{prefab.lower()}", key)

    missing = {p: k for p, k in by_prefab.items() if k not in known}
    for prefab in missing:
        by_prefab.pop(prefab)

    OUT.write_text(
        json.dumps(dict(sorted(by_prefab.items())), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"wrote {len(by_prefab)} prefab names to {OUT}")
    if conflicts:
        print(f"  {len(conflicts)} dropped for naming two keys: {', '.join(sorted(conflicts))}")
    if missing:
        print(f"  {len(missing)} dropped for a key the catalogue lacks: {', '.join(sorted(missing))}")


if __name__ == "__main__":
    main()

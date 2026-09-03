"""Collect the duplicant effect ids, and their display names.

Effects are the timed modifiers a duplicant carries - "Sore Back", "Freshened
Up", room bonuses and so on. There is no single list of them in the game: many
are constructed with a literal id, but whole families (Decor0..Decor5,
Edible-2..Edible3, the room effects) are built at runtime, so scanning code
alone misses them.

Three sources are merged:

  1. `new Effect("...")` literals in the decompiled assembly - definitive
  2. ids present in real save files - definitive, and the only source for the
     runtime-built families
  3. the ids the parser already listed - kept so old saves keep working

Display names come from STRINGS.DUPLICANTS.MODIFIERS, which is a superset of
effects: it also names attribute modifiers. That is fine for looking a name up,
but it is why the *ids* are not taken from there.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

TOOLS = Path(__file__).parent
DECOMP = TOOLS / "decomp"
POT = Path(
    "C:/Steam/steamapps/common/OxygenNotIncluded/OxygenNotIncluded_Data"
    "/StreamingAssets/strings/strings_template.pot"
)
SAVE_EFFECTS = TOOLS / "save-effects.json"

# --- 1. assembly literals --------------------------------------------------
from_assembly = set()
for path in DECOMP.rglob("*.cs"):
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        continue
    from_assembly.update(re.findall(r'new Effect\("([A-Za-z0-9_]+)"', text))

# --- 2. ids observed in real saves ----------------------------------------
from_saves = set()
if SAVE_EFFECTS.exists():
    from_saves.update(json.loads(SAVE_EFFECTS.read_text(encoding="utf-8")))
else:
    print(f"note: {SAVE_EFFECTS.name} not found; skipping the save-derived ids")

# --- 3. whatever the parser already had ------------------------------------
existing = set()
try:
    out = subprocess.run(
        [
            "node",
            "-e",
            "console.log(require('@konove/oni-save-parser').AI_EFFECT_IDS.join('\\n'))",
        ],
        capture_output=True,
        text=True,
        cwd=TOOLS.parent,
    )
    existing.update(x for x in out.stdout.split() if x)
except Exception as e:  # noqa: BLE001
    print(f"note: could not read the current AI_EFFECT_IDS ({e})")

# --- display names ---------------------------------------------------------
pot = POT.read_text(encoding="utf-8", errors="replace")
names = {}
for m in re.finditer(
    r'msgctxt "STRINGS\.DUPLICANTS\.MODIFIERS\.([A-Z0-9_]+)\.NAME"\r?\n'
    r'msgid "((?:[^"\\]|\\.)*)"',
    pot,
):
    names[m.group(1)] = re.sub(
        r"<[^>]*>", "", m.group(2).replace('\\"', '"')
    ).strip()

# The assembly's Effect literals include critter effects - GlassDeerWellFed,
# RaptorWellFed, Incubating - which mean nothing on a duplicant. Those have no
# entry in the player-facing MODIFIERS strings, so requiring a display name
# filters them out. Ids seen on a real duplicant are kept regardless, since
# their presence is proof enough.
ids = sorted(
    from_saves
    | existing
    | {e for e in from_assembly if e.upper() in names}
)

named = {}
unnamed = []
for eid in ids:
    name = names.get(eid.upper())
    if name:
        named[eid] = name
    else:
        unnamed.append(eid)

(TOOLS / "effect-ids.json").write_text(json.dumps(ids, indent=2), encoding="utf-8")
(TOOLS / "effect-names.json").write_text(
    json.dumps(named, indent=2), encoding="utf-8"
)

print(f"ids: {len(ids)}")
print(f"  from the assembly: {len(from_assembly)}")
print(f"  from real saves:   {len(from_saves)}")
print(f"  already listed:    {len(existing)}")
print(f"named: {len(named)}   unnamed: {len(unnamed)}")
if unnamed:
    print("\nno display name (will fall back to the id):")
    print("  " + ", ".join(unnamed))

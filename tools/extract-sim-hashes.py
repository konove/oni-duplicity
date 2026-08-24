"""Regenerate the parser's SimHashes enum from the game's own element list.

`SimHashes` is the parser's element identity: every `PrimaryElement` in a save
names its element by hash, and anything the enum does not know is simply absent
from the Materials page - not zero, not "other", just missing. The enum listed
149 of the game's 212 entries, which on one real colony hid 285.4 t of material
(Shale 197.4 t, NickelOre 44.1 t, Peat 43.9 t).

Unlike the other extractors here, this one needs no decompiler. The game ships
its element definitions as plain YAML, and Klei generates the C# enum from that
same list - the giveaway is the comment beside its last entry:

    - elementId: COMPOSITION #this is just here so it is added to the simhashes.cs file!

So COMPOSITION is not an element; it exists only to reach the enum. It is
mirrored anyway, because the parser's job is to name whatever the game may
write, and an enum that quietly differs from the game's is worse than one
carrying a name nothing will ever match.

The values are `Hash.SDBMLower(elementId)`. That was verified three ways before
this script was trusted to generate anything:

  * all 212 values in the decompiled `SimHashes` equal the hash of their own name
  * all 149 values the parser already had equal the hash of their own name
  * the 212 ids in the YAML reproduce the decompiled enum exactly, name for name

Which is why the enum can be rebuilt from names alone. The script still refuses
to write if any name the parser already knew would change value - a wrong hash
mis-identifies material rather than omitting it, which is the worse failure.

Usage:

    python extract-sim-hashes.py [output.ts]

Then the parser fork round trip: copy over
`src/save-structure/const-data/template-enumerations/sim-hashes.ts`, `npm run
build` there, commit, push, and re-pin the sha in this repo's package.json.
"""

import re
import sys
from pathlib import Path

TOOLS = Path(__file__).parent
ELEMENTS = Path(
    "C:/Steam/steamapps/common/OxygenNotIncluded/OxygenNotIncluded_Data"
    "/StreamingAssets/elements"
)
# Checked against, never written to. Point it at a fork checkout to compare.
CURRENT = Path("F:/Projects/oni-save-parser/src/save-structure/const-data"
               "/template-enumerations/sim-hashes.ts")

ELEMENT_ID = re.compile(r"^\s*-?\s*elementId:\s*([A-Za-z0-9_]+)")
ENUM_ENTRY = re.compile(r"^\s*(\w+)\s*=\s*(-?\d+)", re.MULTILINE)

# The tail is fixed text rather than generated: it is the fork's own style, and
# this repo's prettier config does not apply over there.
EPILOGUE = """
export type SimHashName = keyof typeof SimHashes;
export const SimHashNames: SimHashName[] = Object.keys(SimHashes)
  .filter(x => isNaN(x as any))
  .sort() as any;
"""


def sdbm_lower(name: str) -> int:
    """Klei's `Hash.SDBMLower`, which lowercases as it goes."""
    value = 0
    for byte in name.encode("utf-8"):
        if 0x41 <= byte <= 0x5A:  # 'A'-'Z'
            byte += 32
        value = (byte + (value << 6) + (value << 16) - value) & 0xFFFFFFFF
    return value - 0x100000000 if value >= 0x80000000 else value


def read_element_ids() -> list[str]:
    if not ELEMENTS.is_dir():
        sys.exit(f"no element definitions at {ELEMENTS} - is the game installed?")

    ids: list[str] = []
    for path in sorted(ELEMENTS.glob("*.yaml")):
        for line in path.read_text(encoding="utf-8").splitlines():
            match = ELEMENT_ID.match(line)
            if match:
                ids.append(match.group(1))

    duplicates = {name for name in ids if ids.count(name) > 1}
    if duplicates:
        sys.exit(f"the same elementId appears twice: {', '.join(sorted(duplicates))}")

    return ids


def read_current() -> dict[str, int]:
    if not CURRENT.is_file():
        print(f"note: no enum to compare against at {CURRENT}")
        return {}
    text = CURRENT.read_text(encoding="utf-8")
    return {name: int(value) for name, value in ENUM_ENTRY.findall(text)}


def render(hashes: dict[str, int]) -> str:
    lines = ["export enum SimHashes {"]
    entries = sorted(hashes.items(), key=lambda item: item[1])
    for index, (name, value) in enumerate(entries):
        comma = "" if index == len(entries) - 1 else ","
        sign = "-" if value < 0 else ""
        lines.append(f"  {name} = {value}{comma} // {sign}0x{abs(value):08X}")
    lines.append("}")
    return "\n".join(lines) + "\n" + EPILOGUE


def main() -> None:
    ids = read_element_ids()
    hashes = {name: sdbm_lower(name) for name in ids}

    collisions = [n for n in hashes if list(hashes.values()).count(hashes[n]) > 1]
    if collisions:
        sys.exit(f"two elements hash to the same value: {', '.join(collisions)}")

    current = read_current()
    changed = [
        f"{name}: {current[name]} -> {hashes[name]}"
        for name in current
        if name in hashes and current[name] != hashes[name]
    ]
    if changed:
        sys.exit(
            "refusing to write: these already-known elements would change value, "
            "which mis-identifies material rather than omitting it.\n  "
            + "\n  ".join(changed)
        )

    dropped = sorted(set(current) - set(hashes))
    added = sorted(set(hashes) - set(current))

    out = Path(sys.argv[1]) if len(sys.argv) > 1 else TOOLS / "sim-hashes.ts"
    out.write_text(render(hashes), encoding="utf-8", newline="\n")

    print(f"wrote {out} - {len(hashes)} elements")
    if dropped:
        print(f"DROPPED {len(dropped)} the parser had: {', '.join(dropped)}")
        print("  a removal is not expected; check before shipping this")
    print(f"added {len(added)}: {', '.join(added)}" if added else "no new elements")


if __name__ == "__main__":
    main()

"""Extract the duplicant skill table from the decompiled game.

Skills are not a flat list: each carries the content packs it needs and the
duplicant model it applies to, so the editor can only offer the right ones once
it knows both. `Database/Skills.cs` is the source.

    new Skill(id, NAME, DESC, tier, hat, badge, group, perks,
              prerequisites, model, requiredDlcIds)

Some are additionally wrapped in `if (DlcManager.IsContentSubscribed("X"))`,
which is an equivalent requirement.
"""

import json
import re
from pathlib import Path

SCRATCH = Path(__file__).parent
SKILLS_CS = SCRATCH / "decomp/Database/Skills.cs"
POT = Path(
    "C:/Steam/steamapps/common/OxygenNotIncluded/OxygenNotIncluded_Data"
    "/StreamingAssets/strings/strings_template.pot"
)

pot = POT.read_text(encoding="utf-8", errors="replace")
role_names = {}
for m in re.finditer(
    r'msgctxt "STRINGS\.DUPLICANTS\.ROLES\.([A-Z0-9_]+)\.NAME"\r?\nmsgid "((?:[^"\\]|\\.)*)"',
    pot,
):
    role_names[m.group(1)] = re.sub(r"<[^>]*>", "", m.group(2).replace('\\"', '"')).strip()

text = SKILLS_CS.read_text(encoding="utf-8", errors="replace")

# DlcManager.DLCn shorthands used in place of a literal array.
DLC_ALIASES = {
    "DlcManager.DLC2": ["DLC2_ID"],
    "DlcManager.DLC3": ["DLC3_ID"],
    "DlcManager.DLC4": ["DLC4_ID"],
    "DlcManager.DLC5": ["DLC5_ID"],
    "DlcManager.EXPANSION1": ["EXPANSION1_ID"],
}


def split_args(s):
    out, depth, cur, instr = [], 0, "", False
    i = 0
    while i < len(s):
        c = s[i]
        if instr:
            cur += c
            if c == "\\":
                cur += s[i + 1]
                i += 2
                continue
            if c == '"':
                instr = False
        elif c == '"':
            instr = True
            cur += c
        elif c in "([{":
            depth += 1
            cur += c
        elif c in ")]}":
            depth -= 1
            cur += c
        elif c == "," and depth == 0:
            out.append(cur.strip())
            cur = ""
        else:
            cur += c
        i += 1
    if cur.strip():
        out.append(cur.strip())
    return out


def call_args(src, open_paren):
    depth, j, instr = 0, open_paren, False
    while j < len(src):
        c = src[j]
        if instr:
            if c == "\\":
                j += 2
                continue
            if c == '"':
                instr = False
        elif c == '"':
            instr = True
        elif c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                return src[open_paren + 1 : j], j
        j += 1
    raise ValueError("unbalanced")


# Ranges guarded by `if (DlcManager.IsContentSubscribed("X"))`, so skills
# declared inside inherit that requirement.
guards = []
for m in re.finditer(r'if \(DlcManager\.IsContentSubscribed\("([A-Z0-9_]+)"\)\)', text):
    brace = text.index("{", m.end())
    depth, j = 0, brace
    while j < len(text):
        if text[j] == "{":
            depth += 1
        elif text[j] == "}":
            depth -= 1
            if depth == 0:
                break
        j += 1
    guards.append((brace, j, m.group(1)))


def guard_dlcs(pos):
    return [dlc for start, end, dlc in guards if start <= pos <= end]


skills = []
for m in re.finditer(r"new Skill\(", text):
    args_src, end = call_args(text, m.end() - 1)
    args = split_args(args_src)
    if not args:
        continue

    sid = re.match(r'^"([^"]*)"$', args[0])
    if not sid:
        continue
    sid = sid.group(1)

    name_key = None
    nm = re.match(r"DUPLICANTS\.ROLES\.([A-Z0-9_]+)\.NAME", args[1]) if len(args) > 1 else None
    if nm:
        name_key = nm.group(1)

    required = set(guard_dlcs(m.start()))
    model = "Minion"
    for arg in args[2:]:
        stripped = arg.strip()

        # Only a whole argument counts as the requiredDlcIds list. Several
        # skills switch their *perks* on a DLC inline - Farming1 reads
        # `IsContentSubscribed("DLC5_ID") ? perksA : perksB` - and matching a
        # DLC id anywhere would wrongly gate the skill itself.
        if stripped in DLC_ALIASES:
            required.update(DLC_ALIASES[stripped])
        elif re.match(r'^new string\[\d*\]\s*\{[^{}]*\}$', stripped):
            required.update(
                re.findall(r'"(DLC\d_ID|EXPANSION1_ID|VANILLA_ID)"', stripped)
            )

        if "Models.Bionic" in arg:
            model = "BionicMinion"
        elif re.match(r'^"Minion"$', arg.strip()):
            model = "Minion"

    skills.append(
        {
            "id": sid,
            "name": role_names.get(name_key, sid) if name_key else sid,
            "requiredDlcIds": sorted(required),
            "model": model,
        }
    )

# A few ids are constructed in more than one branch - Astronauting1 exists
# both as an Expansion1 variant and as a plain base-game one, under different
# names. The skill therefore exists whenever *any* branch would build it, so
# take the intersection of the requirements and prefer the name from the least
# restricted variant.
ordered, index = [], {}
for s in skills:
    prev = index.get(s["id"])
    if prev is None:
        index[s["id"]] = s
        ordered.append(s)
        continue
    if len(s["requiredDlcIds"]) < len(prev["requiredDlcIds"]):
        prev["name"] = s["name"]
        prev["model"] = s["model"]
    prev["requiredDlcIds"] = sorted(
        set(prev["requiredDlcIds"]) & set(s["requiredDlcIds"])
    )

(SCRATCH / "skills.json").write_text(json.dumps(ordered, indent=2), encoding="utf-8")

print(f"skills: {len(ordered)}")
gated = [s for s in ordered if s["requiredDlcIds"]]
print(f"DLC-gated: {len(gated)}")
for s in ordered:
    if s["requiredDlcIds"] or s["model"] != "Minion":
        print(f"  {s['id']:<14} {s['name']:<26} {','.join(s['requiredDlcIds']) or '-':<12} {s['model']}")

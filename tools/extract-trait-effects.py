"""Derive each trait's effect lines from the decompiled game assembly.

The game builds a trait tooltip as description + attribute modifiers + disabled
chore groups + ignored effects (Klei.AI.Trait.GetTooltip). Only the description
lives in the string table; the modifiers are code. This reads them out of
TUNING/TRAITS.cs, resolves the constants they reference, and formats each line
the way the game does.
"""

import ast
import json
import operator
import re
from pathlib import Path

SCRATCH = Path(__file__).parent
DECOMP = SCRATCH / "decomp"
POT = Path(
    "C:/Steam/steamapps/common/OxygenNotIncluded/OxygenNotIncluded_Data"
    "/StreamingAssets/strings/strings_template.pot"
)

# ---------------------------------------------------------------- string table
pot = POT.read_text(encoding="utf-8", errors="replace")


def pot_map(pattern):
    out = {}
    for m in re.finditer(pattern + r'"\r?\nmsgid "((?:[^"\\]|\\.)*)"', pot):
        out[m.group(1)] = m.group(2)
    return out


TRAIT_NS = r'msgctxt "STRINGS\.DUPLICANTS\.(?:TRAITS|TRAITS\.NEEDS|CONGENITALTRAITS)\.([A-Z0-9_]+)\.'
short_desc = pot_map(TRAIT_NS + "SHORT_DESC")
extended = pot_map(TRAIT_NS + "EXTENDED_DESC")
attr_names = pot_map(r'msgctxt "STRINGS\.DUPLICANTS\.ATTRIBUTES\.([A-Z0-9_]+)\.NAME')
chore_names = pot_map(r'msgctxt "STRINGS\.DUPLICANTS\.CHOREGROUPS\.([A-Z0-9_]+)\.NAME')
effect_names = pot_map(r'msgctxt "STRINGS\.DUPLICANTS\.MODIFIERS\.([A-Z0-9_]+)\.NAME')


def clean(s):
    s = s.replace('\\"', '"').replace("\\n", " ")
    s = re.sub(r"<[^>]*>", "", s)
    return s.strip()


# ------------------------------------------------------------------- constants
# Numeric constants the trait definitions reference, collected from the TUNING
# sources by qualified name. Only simple literal assignments are picked up;
# anything else stays unresolved and is reported rather than guessed.
CONSTS = {}
DERIVED = {}


def collect_consts(path, prefix_stack_root):
    """Scan a decompiled C# file for `... NAME = <number>;` inside nested classes."""
    text = path.read_text(encoding="utf-8", errors="replace")
    stack = [prefix_stack_root]
    pending_effector = []
    depth_of = []
    depth = 0
    for line in text.splitlines():
        stripped = line.strip()
        m = re.match(r"(?:public|private|internal|protected)?\s*(?:static\s+)?(?:partial\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)", stripped)
        if m:
            stack.append(m.group(1))
            depth_of.append(depth + 1)
        # Plain numeric fields, static or instance.
        m = re.match(
            r"(?:public|private|internal|protected)\s+(?:static\s+)?(?:readonly\s+)?(?:const\s+)?"
            r"(?:int|float|double)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([-+0-9.eEf ]+);",
            stripped,
        )
        if m:
            raw = m.group(2).strip().rstrip("f")
            try:
                CONSTS[".".join(stack + [m.group(1)])] = float(raw)
            except ValueError:
                pass

        # Fields whose initialiser is arithmetic rather than a bare literal
        # (`1f / 6f`); deferred to the derived pass.
        m = re.match(
            r"(?:public|private|internal|protected)\s+(?:static\s+)?(?:readonly\s+)?(?:const\s+)?"
            r"(?:int|float|double)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([-+0-9.eEf ]+[*/][-+0-9.eEf ]+);",
            stripped,
        )
        if m:
            DERIVED.setdefault(".".join(stack + [m.group(1)]), m.group(2))

        # Expression-bodied properties: resolved in a later pass once their
        # dependencies are known.
        m = re.match(
            r"(?:public|private|internal|protected)\s+(?:static\s+)?"
            r"(?:int|float|double)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=>\s*(.+);",
            stripped,
        )
        if m:
            DERIVED[".".join(stack + [m.group(1)])] = m.group(2)

        # `X = new EffectorValues { amount = N, ... }` - decor tiers reference
        # the amount by name, so record it as `X.amount`.
        m = re.match(
            r"(?:public|private|internal|protected)\s+(?:static\s+)?(?:readonly\s+)?"
            r"EffectorValues\s+([A-Za-z_][A-Za-z0-9_]*)\s*=", stripped)
        if m:
            pending_effector.append(".".join(stack + [m.group(1)]))
        m = re.match(r"amount\s*=\s*([-+0-9.eEf]+)", stripped)
        if m and pending_effector:
            CONSTS[pending_effector.pop(0) + ".amount"] = float(m.group(1).rstrip("f"))
        depth += line.count("{") - line.count("}")
        while depth_of and depth < depth_of[-1]:
            depth_of.pop()
            stack.pop()


for rel, root in [
    ("TUNING/TRAITS.cs", "TRAITS"),
    ("TUNING/DUPLICANTSTATS.cs", "DUPLICANTSTATS"),
    ("TUNING/BUILDINGS.cs", "BUILDINGS"),
]:
    p = DECOMP / rel
    if p.exists():
        collect_consts(p, root)

# Decor tiers are `new DecorInfo(amount, ...)` style records, not plain
# constants; pull their amounts out separately if present.
bld = (DECOMP / "TUNING/BUILDINGS.cs")
if bld.exists():
    btext = bld.read_text(encoding="utf-8", errors="replace")
    for m in re.finditer(
        r"(TIER\d)\s*=\s*new\s+DecorInfo\(\s*([-0-9.f]+)", btext
    ):
        pass  # recorded below via the generic amount scan

# The EffectorValues scan cannot reliably pair a declaration with its `amount`
# once MONUMENT's nested entries interleave, so the two decor tiers the traits
# actually reference are pinned here. Read directly from
# decomp/TUNING/BUILDINGS.cs, class DECOR:
#   BONUS.TIER4   amount = 25
#   PENALTY.TIER2 amount = -15
CONSTS["BUILDINGS.DECOR.BONUS.TIER4.amount"] = 25.0
CONSTS["BUILDINGS.DECOR.PENALTY.TIER2.amount"] = -15.0


def _resolve_derived():
    """Fold `X => <expr>` properties into CONSTS once their inputs are known."""
    for _ in range(5):
        progress = False
        for name, expr in list(DERIVED.items()):
            if name in CONSTS:
                continue
            val = evaluate(expr, set())
            if val is not None:
                CONSTS[name] = val
                progress = True
        if not progress:
            break


# ------------------------------------------------------------------ evaluation
_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def evaluate(expr, unresolved):
    """Evaluate a C# numeric expression, substituting known constants."""
    e = expr.strip()
    e = re.sub(r"(\d)f\b", r"\1", e)          # 0.5f -> 0.5
    e = re.sub(r"\bf\b", "", e)

    # References are written against instance paths (STANDARD.BaseStats.X)
    # while constants were collected against declaring types
    # (DUPLICANTSTATS.BASESTATS.X), so match on the trailing segment. `.amount`
    # stays part of the name because decor tiers are addressed that way.
    # Index every suffix of each qualified name, so a reference can be matched
    # on the longest suffix that is unambiguous. Matching short tails first
    # would collide: BUILDINGS.DECOR.{BONUS,PENALTY}.TIER4.amount both end
    # "TIER4.amount".
    by_tail = {}
    for name, value in CONSTS.items():
        parts = name.split(".")
        for take in range(1, len(parts) + 1):
            by_tail.setdefault(".".join(parts[-take:]), []).append(value)

    def _sub(match):
        path = match.group(0)
        parts = path.split(".")
        for take in range(len(parts), 0, -1):
            hits = by_tail.get(".".join(parts[-take:]))
            if hits and len(set(hits)) == 1:
                return repr(hits[0])
        return path

    e = re.sub(r"[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*", _sub, e)

    if re.search(r"[A-Za-z_]", e):
        unresolved.add(expr.strip())
        return None

    def _ev(node):
        if isinstance(node, ast.Expression):
            return _ev(node.body)
        if isinstance(node, ast.Constant):
            return float(node.value)
        if isinstance(node, ast.UnaryOp):
            return _OPS[type(node.op)](_ev(node.operand))
        if isinstance(node, ast.BinOp):
            return _OPS[type(node.op)](_ev(node.left), _ev(node.right))
        raise ValueError(node)

    try:
        return _ev(ast.parse(e, mode="eval"))
    except Exception:
        unresolved.add(expr.strip())
        return None


_resolve_derived()

# ------------------------------------------------------- attribute formatters
formatters = {}
attrs_cs = DECOMP / "Database/Attributes.cs"
if attrs_cs.exists():
    text = attrs_cs.read_text(encoding="utf-8", errors="replace")
    cur = None
    for line in text.splitlines():
        m = re.search(r'new Attribute\("([A-Za-z0-9_]+)"', line)
        if m:
            cur = m.group(1)
        m = re.search(
            r"SetFormatter\(new (\w+)AttributeFormatter\((?:GameUtil\.UnitClass\.(\w+),\s*GameUtil\.TimeSlice\.(\w+))?",
            line,
        )
        if m and cur:
            formatters[cur] = (m.group(1), m.group(2), m.group(3))
            cur = None


def format_value(attribute_id, value):
    """Render a modifier value the way the game's attribute formatter would."""
    # Klei.AI.Attribute's own default when no formatter is set is SimpleFloat,
    # not SimpleInteger - rounding these to integers turns the small per-second
    # deltas (Regeneration, SmallBladder) into a misleading "+0".
    kind, unit, slice_ = formatters.get(attribute_id, ("Standard", "SimpleFloat", "None"))
    sign = "+" if value >= 0 else ""

    if kind in ("Percent", "ToPercent"):
        return f"{sign}{value * 100:g}%"
    if unit == "Percent":
        return f"{sign}{value:g}%"
    if unit == "SimpleInteger":
        return f"{sign}{round(value):g}"
    if unit == "SimpleFloat":
        return f"{sign}{round(value, 4):g}"
    if unit == "Temperature":
        return f"{sign}{value:g} °C"
    if unit == "Mass":
        base = f"{sign}{value * 1000:g} g"
        return base + ("/s" if slice_ == "PerSecond" else "")
    if unit == "Radiation":
        return f"{sign}{value:g} rads" + ("/cycle" if slice_ == "PerCycle" else "")
    if unit == "Distance":
        return f"{sign}{value:g} m"
    out = f"{sign}{value:g}"
    if slice_ == "PerSecond":
        out += "/s"
    elif slice_ == "PerCycle":
        out += "/cycle"
    return out


def attribute_label(attribute_id):
    return clean(attr_names.get(attribute_id.upper(), attribute_id)) or attribute_id


def chore_label(group_id):
    return clean(chore_names.get(group_id.upper(), group_id)) or group_id


def effect_label(effect_id):
    return clean(effect_names.get(effect_id.upper(), effect_id)) or effect_id


# ---------------------------------------------------------- trait definitions
traits_cs = (DECOMP / "TUNING/TRAITS.cs").read_text(encoding="utf-8", errors="replace")


def split_args(s):
    """Split a C# argument list on top-level commas."""
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


def call_args(text, start):
    """Return the argument text of the call whose '(' is at/after `start`."""
    i = text.index("(", start)
    depth, j, instr = 0, i, False
    while j < len(text):
        c = text[j]
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
                return text[i + 1 : j]
        j += 1
    raise ValueError("unbalanced")


STR = re.compile(r'^"([^"]*)"$')


def as_str(arg):
    m = STR.match(arg.strip())
    return m.group(1) if m else None


def str_array(arg):
    """Parse `new string[N] { "a", "b" }` or `new string[1] { "a" }`."""
    inner = re.search(r"\{(.*)\}", arg, re.S)
    if not inner:
        return []
    return [as_str(x) for x in split_args(inner.group(1)) if as_str(x)]


def float_array(arg, unresolved):
    inner = re.search(r"\{(.*)\}", arg, re.S)
    if not inner:
        return []
    return [evaluate(x, unresolved) for x in split_args(inner.group(1))]


unresolved = set()
traits = {}

for m in re.finditer(r"TraitUtil\.(\w+)(?:<\w+>)?\s*\(", traits_cs):
    fn = m.group(1)
    args = split_args(call_args(traits_cs, m.end() - 1))
    if not args:
        continue
    trait_id = as_str(args[0])
    if not trait_id:
        continue

    rec = traits.setdefault(trait_id, {"modifiers": [], "chores": [], "immunities": []})

    if fn == "CreateAttributeEffectTrait":
        # Overloads: (id,name,desc, attr, delta, ...) |
        #            (id,name,desc, attr, delta, attr2, delta2, ...) |
        #            (id,name,desc, string[] attrs, float[] deltas, ...)
        if len(args) >= 5 and args[3].startswith("new string["):
            ids = str_array(args[3])
            vals = float_array(args[4], unresolved)
            for a, v in zip(ids, vals):
                rec["modifiers"].append((a, v))
        else:
            a1, v1 = as_str(args[3]), evaluate(args[4], unresolved)
            if a1:
                rec["modifiers"].append((a1, v1))
            if len(args) >= 7 and as_str(args[5]) and re.match(r"^[-+0-9(]", args[6]):
                rec["modifiers"].append((as_str(args[5]), evaluate(args[6], unresolved)))

    elif fn == "CreateTrait" and len(args) >= 5 and as_str(args[3]):
        rec["modifiers"].append((as_str(args[3]), evaluate(args[4], unresolved)))
        if len(args) >= 6:
            rec["chores"] += str_array(args[5])

    elif fn == "CreateDisabledTaskTrait" and len(args) >= 4:
        g = as_str(args[3])
        if g:
            rec["chores"].append(g)

    elif fn == "CreateEffectModifierTrait" and len(args) >= 4:
        rec["immunities"] += str_array(args[3])

    # A few component traits pass an extended-description lambda that formats
    # EXTENDED_DESC with a TRAITS.<X>_MODIFIER constant. That constant is the
    # value the game shows in place of {0}.
    if fn == "CreateComponentTrait":
        for arg in args[3:]:
            if "EXTENDED_DESC" not in arg:
                continue
            ident = re.search(r"\b([A-Z][A-Z0-9_]*_MODIFIER)\b", arg)
            if ident:
                rec["extendedValue"] = evaluate(ident.group(1), unresolved)

# ------------------------------------------------------------------- assemble
CANNOT_DO = clean(pot_map(r'msgctxt "STRINGS\.DUPLICANTS\.TRAITS\.(CANNOT_DO_TASK)').get("CANNOT_DO_TASK", "Cannot do {0} Errands"))
IMMUNE_TO = clean(pot_map(r'msgctxt "STRINGS\.DUPLICANTS\.TRAITS\.(IGNORED_EFFECTS)').get("IGNORED_EFFECTS", "Immune to {0}"))

out = {}
for trait_id, rec in traits.items():
    lines = []
    for attribute_id, value in rec["modifiers"]:
        if value is None:
            continue
        lines.append(f"{attribute_label(attribute_id)}: {format_value(attribute_id, value)}")
    for g in rec["chores"]:
        lines.append(CANNOT_DO.replace("{0}", chore_label(g)))
    for e in rec["immunities"]:
        lines.append(IMMUNE_TO.replace("{0}", effect_label(e)))

    key = trait_id.upper()

    # SHORT_DESC is the game's one-line summary for the trait picker; the
    # tooltip proper does not use it. Keep it only where nothing else describes
    # the trait, so a behavioural trait is not left blank - but drop it when an
    # EXTENDED_DESC follows, since the two say the same thing.
    if key in short_desc and key not in extended:
        lines.append(clean(short_desc[key]))
    if key in extended:
        # These carry a {0} the game fills at runtime with the trait's own
        # value; drop any that we cannot fill rather than show a placeholder.
        text = clean(extended[key])
        if "{0}" in text:
            filled = None
            if rec.get("extendedValue") is not None:
                v = rec["extendedValue"]
                filled = f"{'+' if v >= 0 else ''}{v:g}"
            else:
                for attribute_id, value in rec["modifiers"]:
                    if value is not None:
                        filled = format_value(attribute_id, value)
                        break
            text = text.replace("{0}", filled) if filled else None
        if text:
            lines.append(text.lstrip("• ").strip())

    if lines:
        out[key] = lines

(SCRATCH / "trait-effects.json").write_text(json.dumps(out, indent=2), encoding="utf-8")

print(f"traits with effects: {len(out)}")
print(f"constants resolved: {len(CONSTS)}")
if unresolved:
    print(f"\nUNRESOLVED expressions ({len(unresolved)}):")
    for u in sorted(unresolved):
        print("  ", u)
for probe in ("METEORPHILE", "DIVERSLUNG", "ANEMIC", "STRONGARM", "CONSTRUCTIONUP", "FROSTPROOF", "CANTDIG"):
    print(f"\n{probe}: {out.get(probe)}")

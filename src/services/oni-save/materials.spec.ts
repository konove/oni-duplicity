import { SimHashNames } from "oni-save-parser";

import {
  MaterialGameObjectNames,
  elementDisplayName,
  formatMass,
} from "./materials";
import { ELEMENTS as CATALOGUE } from "@/translations/en/oni.json";

// The JSON resolves to a literal type with 212 named keys; the tests index it
// by an element id computed at runtime.
const ELEMENTS: Record<string, { NAME: string } | undefined> = CATALOGUE;

// The formatter records both the unit and the number, since the bug it fixes
// was a plausible-looking number under the wrong unit.
const t = (key: string, { count }: { count: number }) => `${key}:${count}`;

// Boundaries come from GameUtil.AppendFormattedMass under
// MetricMassFormat.UseThreshold, not from SI convention: the game switches at
// 5 and 5000, and calls zero kilograms.
describe("formatMass", () => {
  it("matches the game on a real colony's dirt", () => {
    // 115,665 kg, which the game shows as 115.6 tons.
    expect(formatMass(115665.18, t)).toBe("material.tonne:115.7");
  });

  it("matches the game on a real colony's algae", () => {
    // 2,544 kg stays in kilograms because it is under five tonnes.
    expect(formatMass(2544, t)).toBe("material.kilogram:2544");
  });

  it("switches to tonnes at five thousand kilograms, not one", () => {
    expect(formatMass(4999, t)).toBe("material.kilogram:4999");
    expect(formatMass(5000, t)).toBe("material.tonne:5");
  });

  it("switches to grams below five kilograms, not one", () => {
    expect(formatMass(4.9, t)).toBe("material.gram:4900");
    expect(formatMass(5, t)).toBe("material.kilogram:5");
  });

  it("uses milligrams and micrograms below that", () => {
    expect(formatMass(0.004, t)).toBe("material.milligram:4000");
    expect(formatMass(0.000004, t)).toBe("material.microgram:4000");
  });

  it("calls zero kilograms, as the game does", () => {
    expect(formatMass(0, t)).toBe("material.kilogram:0");
  });

  it("keeps at most one decimal, like the game's {0:0.#}", () => {
    expect(formatMass(1.23456, t)).toBe("material.gram:1234.6");
    expect(formatMass(2635.83, t)).toBe("material.kilogram:2635.8");
  });

  it("handles negative masses without changing unit choice", () => {
    expect(formatMass(-6000, t)).toBe("material.tonne:-6");
  });
});

// The Materials page can only show a material the parser can name. When the
// enum knew 149 of the game's 212 elements, everything else was absent from the
// table rather than reported as unknown - 285.4 t on one real colony, most of it
// shale. These guard the two halves of that: the ids, and their names.
describe("MaterialGameObjectNames", () => {
  it("covers every element the parser knows", () => {
    expect(MaterialGameObjectNames).toHaveLength(SimHashNames.length);
  });

  // Measured missing from a real colony: Shale 197.4 t, NickelOre 44.1 t,
  // Peat 43.9 t. Named individually so a regression says what went missing.
  it.each(["Shale", "NickelOre", "Peat"])("lists %s", (element) => {
    expect(MaterialGameObjectNames).toContain(element);
  });

  it("lists the elements the later DLCs added", () => {
    expect(MaterialGameObjectNames).toEqual(
      expect.arrayContaining(["MoltenCobalt", "MurkyBrine", "Iridium", "Zinc"]),
    );
  });
});

describe("elementDisplayName", () => {
  const named = (key: string, { defaultValue }: { defaultValue: string }) => {
    const element = key.replace(/^oni:ELEMENTS\.|\.NAME$/g, "");
    return ELEMENTS[element]?.NAME ?? defaultValue;
  };

  it("uses the game's own name", () => {
    expect(elementDisplayName("NickelOre", named)).toBe("Nickel Ore");
    expect(elementDisplayName("MurkyBrine", named)).toBe("Polluted Brine");
  });

  // Re-pinning the parser forward without re-running extract-translations.py
  // would put ids back on the page. This is the test that says so.
  it("has a catalogue name for every element the parser knows", () => {
    const unnamed = SimHashNames.filter((element) => !ELEMENTS[element]);
    expect(unnamed).toEqual([]);
  });

  // Only reachable if the catalogue falls behind the enum, which the test above
  // exists to prevent - but an id split into words still beats a raw id.
  it("splits an id it has no name for", () => {
    expect(elementDisplayName("MoltenUnobtainium", named)).toBe(
      "Molten Unobtainium",
    );
  });
});

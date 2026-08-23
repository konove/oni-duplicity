import { formatMass } from "./materials";

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

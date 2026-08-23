import { formatMass } from "./materials";

// The formatter picks a unit and a number; recording both is the point, since
// the bug it fixes was a plausible-looking number under the wrong unit.
const t = (key: string, { count }: { count: number }) => `${key}:${count}`;

describe("formatMass", () => {
  it("shows grams below a kilogram", () => {
    expect(formatMass(0.25, t)).toBe("material.gram:250");
  });

  it("shows kilograms from one kilogram", () => {
    expect(formatMass(1, t)).toBe("material.kilogram:1");
    expect(formatMass(2635.83 / 1000, t)).toBe("material.kilogram:2.64");
  });

  // The value that exposed the bug: a real colony's dirt sums to 115,665 units,
  // and the game calls it 115.6 tons. Read as grams it rendered "115.67 kg".
  it("shows tonnes from a thousand kilograms", () => {
    expect(formatMass(115665.18, t)).toBe("material.tonne:115.67");
    expect(formatMass(1000, t)).toBe("material.tonne:1");
  });

  it("switches unit exactly at the boundaries", () => {
    expect(formatMass(0.999, t)).toBe("material.gram:999");
    expect(formatMass(999.99, t)).toBe("material.kilogram:999.99");
  });

  it("rounds to two decimals", () => {
    expect(formatMass(1.23456, t)).toBe("material.kilogram:1.23");
  });

  it("handles zero", () => {
    expect(formatMass(0, t)).toBe("material.gram:0");
  });
});

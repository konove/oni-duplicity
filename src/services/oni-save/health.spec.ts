import { TFunction } from "i18next";

import {
  DISEASE_AMOUNTS,
  FITNESS_AMOUNTS,
  amountFill,
  amountMaximum,
  formatAmount,
  isOffScale,
  statName,
} from "./health";

/**
 * A stand-in for i18next that answers from the real English files, so a name
 * the game does not actually ship cannot be asserted here by accident.
 */
const oni = jest.requireActual("../../translations/en/oni.json");
const common = jest.requireActual("../../translations/en/common.json");

const lookup = (key: string): unknown => {
  const [root, path] = key.startsWith("oni:")
    ? [oni, key.slice("oni:".length)]
    : [common, key];
  return path
    .split(".")
    .reduce<any>((node, part) => (node == null ? node : node[part]), root);
};

const t = ((key: string, options: Record<string, unknown> = {}) => {
  const value = lookup(key);
  return typeof value === "string" ? value : (options.defaultValue ?? key);
}) as unknown as TFunction;

describe("statName", () => {
  // The editor printed raw ids for these for a long time, because it looked in
  // ATTRIBUTES and MODIFIERS. They are in STATS.
  it("uses the game's name for a stat", () => {
    expect(statName("HitPoints", t)).toBe("Health");
    expect(statName("Breath", t)).toBe("Breath");
    expect(statName("Temperature", t)).toBe("Body Temperature");
  });

  // A second table, because the game keeps the germ counters apart from the
  // resources a duplicant spends.
  it("falls through to the game's name for a disease", () => {
    expect(statName("SlimeLung", t)).toBe("Slimelung");
    expect(statName("FoodPoisoning", t)).toBe("Food Poisoning");
    expect(statName("PutridOdour", t)).toBe("Trench Stench");
  });

  it("falls back to ours where the game names nothing", () => {
    expect(statName("ImmuneLevel", t)).toBe("Immunity");
  });

  // The catalogue names neither of these, and the editor deliberately does not
  // invent one: a humanised id is not the game's name, and guessing at
  // `Spores` produced "Zombie spores" beside the game's own "Zombie Spores"
  // for a different counter entirely.
  it("shows the raw id rather than a name nobody chose", () => {
    expect(statName("ColdBrain", t)).toBe("ColdBrain");
    expect(statName("Spores", t)).toBe("Spores");
    expect(statName("NoSuchAmount", t)).toBe("NoSuchAmount");
  });

  it("names every amount the editor shows", () => {
    for (const id of [...FITNESS_AMOUNTS, ...DISEASE_AMOUNTS]) {
      expect(statName(id, t)).not.toBe("");
    }
  });
});

describe("amountMaximum", () => {
  it("knows the one amount that is not out of a hundred", () => {
    expect(amountMaximum("Calories")).toBe(4000000);
    expect(amountMaximum("HitPoints")).toBe(100);
  });
});

describe("amountFill", () => {
  it("is a percentage of the maximum", () => {
    expect(amountFill(50, 100)).toBe(50);
    expect(amountFill(2000000, 4000000)).toBe(50);
  });

  // Neither end is guaranteed: Decor runs negative somewhere ugly, and the
  // bundled save has a duplicant at 200 breath out of 100.
  it("clamps at both ends", () => {
    expect(amountFill(-130, 100)).toBe(0);
    expect(amountFill(200, 100)).toBe(100);
  });

  it("does not divide by a maximum of zero", () => {
    expect(amountFill(5, 0)).toBe(0);
  });
});

describe("isOffScale", () => {
  // The old slider pinned its handle at the end and said nothing, which is how
  // 200 breath on a scale of 100 went unnoticed.
  it("marks a value the scale cannot hold", () => {
    expect(isOffScale(200, 100)).toBe(true);
    expect(isOffScale(-130, 100)).toBe(true);
  });

  it("leaves a value in range alone", () => {
    expect(isOffScale(0, 100)).toBe(false);
    expect(isOffScale(100, 100)).toBe(false);
  });
});

describe("formatAmount", () => {
  it("marks the thousands", () => {
    expect(formatAmount(4000000)).toBe("4,000,000");
  });

  // The game writes these as long floats; two places is as much as anyone can
  // act on.
  it("cuts a float down to two places", () => {
    expect(formatAmount(99.04344177246094)).toBe("99.04");
  });

  it("leaves a whole number whole", () => {
    expect(formatAmount(100)).toBe("100");
  });
});

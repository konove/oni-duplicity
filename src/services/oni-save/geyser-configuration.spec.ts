import { GeyserTypeNames } from "oni-save-parser";

import {
  BEST_CASE_ROLLS,
  GEYSER_TYPES,
  GeyserTypeInfo,
  SECONDS_PER_CYCLE,
  formatCycles,
  formatDuration,
  formatSeconds,
  formatTemperature,
  geyserReadout,
  geyserTypeInfo,
  isBestCase,
  resampleRoll,
  rollForValue,
} from "./geyser-configuration";

/** Relative comparison: the game computes in float32, this module in float64. */
function expectClose(actual: number, expected: number, tolerance = 1e-6): void {
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(
    tolerance,
  );
}

// Stands in for i18next, rendering the key and count so a formatter's choice of
// unit is visible in the assertion.
const t = (key: string, { count }: { count: number }) => `${count} [${key}]`;

describe("resampleRoll", () => {
  // The save stores the game's own resampled values beside the rolls that
  // produced them, so a real save is an oracle for this curve. These five pairs
  // are the chlorine_gas_cool geyser in src/__mocks__/save-game.json, with the
  // ranges the game gives that type.
  it.each([
    ["rate", 0.15200908482074738, 70, 140, 95.05043029785156],
    ["iteration length", 0.21407416462898254, 60, 1140, 483.7059631347656],
    ["iteration percent", 0.22284933924674988, 0.1, 0.9, 0.41725054383277893],
    ["year length", 0.09112510830163956, 15000, 135000, 52241.99609375],
    ["year percent", 0.5358698964118958, 0.4, 0.8, 0.6047671437263489],
  ])("reproduces the game's scaled %s", (_, roll, min, max, expected) => {
    expectClose(resampleRoll(roll, min, max), expected);
  });

  it("reaches both ends of the range exactly", () => {
    expectClose(resampleRoll(0, 70, 140), 70);
    expectClose(resampleRoll(1, 70, 140), 140);
  });

  // The curve is a logit, not a line: half a roll is the midpoint, but the
  // quarters are not the quarters. Reading this as linear was the temptation.
  it("puts a roll of one half at the midpoint", () => {
    expectClose(resampleRoll(0.5, 200, 400), 300);
  });

  it("bunches rolls towards the middle of the range", () => {
    const linear = 200 + 0.75 * (400 - 200);
    expect(resampleRoll(0.75, 200, 400)).toBeLessThan(linear);
    expect(resampleRoll(0.75, 200, 400)).toBeGreaterThan(300);
  });
});

describe("rollForValue", () => {
  it("inverts resampleRoll", () => {
    for (const roll of [0.05, 0.25, 0.5, 0.75, 0.95]) {
      const value = resampleRoll(roll, 480, 1080);
      expect(rollForValue(value, 480, 1080)).toBeCloseTo(roll, 6);
    }
  });

  it("clamps a value outside the range", () => {
    expect(rollForValue(0, 200, 400)).toBe(0);
    expect(rollForValue(1000, 200, 400)).toBe(1);
  });

  // The oil fissure's iteration length and percent are both pinned to a single
  // value, so there is no gradient to invert and every roll means the same.
  it("survives a range with no width", () => {
    expect(rollForValue(600, 600, 600)).toBe(0);
    expect(resampleRoll(rollForValue(600, 600, 600), 600, 600)).toBe(600);
  });
});

describe("GEYSER_TYPES", () => {
  it("describes every type the parser models", () => {
    for (const type of GeyserTypeNames) {
      expect(geyserTypeInfo(type)).not.toBeNull();
    }
  });

  it("describes nothing the parser does not model", () => {
    expect(Object.keys(GEYSER_TYPES).sort()).toEqual(
      [...GeyserTypeNames].sort(),
    );
  });

  it("gives every range a low end below its high end", () => {
    for (const [type, info] of Object.entries(GEYSER_TYPES)) {
      expect(info.minRate).toBeLessThan(info.maxRate);
      expect(info.minIterationLength).toBeLessThanOrEqual(
        info.maxIterationLength,
      );
      expect(info.minIterationPercent).toBeLessThanOrEqual(
        info.maxIterationPercent,
      );
      expect(info.minYearLength).toBeLessThan(info.maxYearLength);
      expect(info.minYearPercent).toBeLessThan(info.maxYearPercent);
      // Named so a failure says which type is wrong.
      expect(type).toBe(type);
    }
  });

  // The copper volcano the design was drawn against, checked field by field
  // against GeyserGenericConfig.
  it("has the copper volcano's real ranges", () => {
    expect(geyserTypeInfo("molten_copper")).toEqual({
      element: "MoltenCopper",
      temperature: 2500,
      minRate: 200,
      maxRate: 400,
      minIterationLength: 480,
      maxIterationLength: 1080,
      minIterationPercent: 1 / 60,
      maxIterationPercent: 0.1,
      minYearLength: 15000,
      maxYearLength: 135000,
      minYearPercent: 0.4,
      maxYearPercent: 0.8,
    });
  });

  it("has no info for a type the game does not have", () => {
    expect(geyserTypeInfo("molten_unobtainium")).toBeNull();
  });
});

/** A type whose every range is pinned, so the rolls cannot affect the result. */
function fixedType(values: {
  rate: number;
  iterationLength: number;
  iterationPercent: number;
  yearLength: number;
  yearPercent: number;
}): GeyserTypeInfo {
  return {
    element: "MoltenCopper",
    temperature: 2500,
    minRate: values.rate,
    maxRate: values.rate,
    minIterationLength: values.iterationLength,
    maxIterationLength: values.iterationLength,
    minIterationPercent: values.iterationPercent,
    maxIterationPercent: values.iterationPercent,
    minYearLength: values.yearLength,
    maxYearLength: values.yearLength,
    minYearPercent: values.yearPercent,
    maxYearPercent: values.yearPercent,
  };
}

const ANY_ROLLS = {
  rateRoll: 0.5,
  iterationLengthRoll: 0.5,
  iterationPercentRoll: 0.5,
  yearLengthRoll: 0.5,
  yearPercentRoll: 0.5,
};

describe("geyserReadout", () => {
  // Copper Volcano U014 from a real colony: the game's own panel reads
  // "6.9 kg/s", "79s every 1030s", "91.8 of 153.1 cycles" and "317 g/s".
  const U014 = fixedType({
    rate: 317,
    iterationLength: 1030,
    iterationPercent: 79 / 1030,
    yearLength: 153.1 * SECONDS_PER_CYCLE,
    yearPercent: 0.6,
  });

  it("derives the rate the game prints while erupting", () => {
    expectClose(geyserReadout(U014, ANY_ROLLS).emitRate, 6.888, 1e-3);
  });

  it("derives the average the game prints over the whole year", () => {
    expectClose(geyserReadout(U014, ANY_ROLLS).averageEmission, 0.317, 1e-3);
  });

  it("derives the two durations the game prints", () => {
    const readout = geyserReadout(U014, ANY_ROLLS);
    expectClose(readout.onDuration, 79);
    expectClose(readout.yearOnDuration, 91.86 * SECONDS_PER_CYCLE);
  });

  // The claim the Best case button rests on. If the average ever started
  // depending on the eruption timings, the button would be setting the wrong
  // sliders and its caption would be a lie.
  it("leaves the average untouched by the eruption timings", () => {
    const brief = fixedType({
      rate: 317,
      iterationLength: 480,
      iterationPercent: 1 / 60,
      yearLength: 153.1 * SECONDS_PER_CYCLE,
      yearPercent: 0.6,
    });
    const drawnOut = fixedType({
      rate: 317,
      iterationLength: 1080,
      iterationPercent: 0.1,
      yearLength: 153.1 * SECONDS_PER_CYCLE,
      yearPercent: 0.6,
    });

    expectClose(
      geyserReadout(brief, ANY_ROLLS).averageEmission,
      geyserReadout(drawnOut, ANY_ROLLS).averageEmission,
    );
    // ...while the burst rate moves by a factor of six.
    expect(geyserReadout(brief, ANY_ROLLS).emitRate).toBeGreaterThan(
      geyserReadout(drawnOut, ANY_ROLLS).emitRate * 5,
    );
  });

  // The other half of the same claim: the full cycle's length is not in the
  // average either, which is why Best case shortens it rather than stretching it.
  it("leaves the average untouched by the full cycle's length", () => {
    const short = fixedType({
      rate: 317,
      iterationLength: 1030,
      iterationPercent: 0.077,
      yearLength: 25 * SECONDS_PER_CYCLE,
      yearPercent: 0.8,
    });
    const long = fixedType({
      rate: 317,
      iterationLength: 1030,
      iterationPercent: 0.077,
      yearLength: 225 * SECONDS_PER_CYCLE,
      yearPercent: 0.8,
    });

    expectClose(
      geyserReadout(short, ANY_ROLLS).averageEmission,
      geyserReadout(long, ANY_ROLLS).averageEmission,
    );
    // What it does change is how long you must buffer through.
    const dormant = (info: GeyserTypeInfo) => {
      const readout = geyserReadout(info, ANY_ROLLS);
      return readout.yearLength - readout.yearOnDuration;
    };
    expectClose(dormant(short), 5 * SECONDS_PER_CYCLE);
    expectClose(dormant(long), 45 * SECONDS_PER_CYCLE);
  });

  it("reads a roll of zero and one straight off the type's range", () => {
    const info = geyserTypeInfo("molten_copper")!;
    const readout = geyserReadout(info, {
      rateRoll: 1,
      iterationLengthRoll: 0,
      iterationPercentRoll: 1,
      yearLengthRoll: 0,
      yearPercentRoll: 1,
    });

    expectClose(readout.massPerCycle, 400);
    expectClose(readout.iterationLength, 480);
    expectClose(readout.iterationPercent, 0.1);
    expectClose(readout.yearLength, 15000);
    expectClose(readout.yearPercent, 0.8);
  });
});

describe("BEST_CASE_ROLLS", () => {
  const info = geyserTypeInfo("molten_copper")!;
  const before = {
    rateRoll: 0.5,
    iterationLengthRoll: 0.5,
    iterationPercentRoll: 0.5,
    yearLengthRoll: 0.5,
    yearPercentRoll: 0.5,
  };
  const after = { ...before, ...BEST_CASE_ROLLS };

  it("gives the most material the type can produce", () => {
    expectClose(
      geyserReadout(info, after).averageEmission,
      (info.maxRate * info.maxYearPercent) / SECONDS_PER_CYCLE,
    );
    expect(geyserReadout(info, after).averageEmission).toBeGreaterThan(
      geyserReadout(info, before).averageEmission,
    );
  });

  it("gives the shortest dormant stretch the type can have", () => {
    const dormant = (rolls: typeof before) => {
      const readout = geyserReadout(info, rolls);
      return readout.yearLength - readout.yearOnDuration;
    };
    expectClose(dormant(after), info.minYearLength * (1 - info.maxYearPercent));
    expect(dormant(after)).toBeLessThan(dormant(before));
  });

  // Deliberately not maximal: burstiness is a preference, not an improvement.
  it("leaves the eruption timings alone", () => {
    expect(BEST_CASE_ROLLS.iterationLengthRoll).toBeUndefined();
    expect(BEST_CASE_ROLLS.iterationPercentRoll).toBeUndefined();
  });
});

// The button is disabled on this, and every reducer sets `isModified` - so a
// wrong answer here either marks a save dirty for a change that did not happen,
// or greys out a button that still had work to do.
describe("isBestCase", () => {
  const rolls = {
    rateRoll: 0.5,
    iterationLengthRoll: 0.5,
    iterationPercentRoll: 0.5,
    yearLengthRoll: 0.5,
    yearPercentRoll: 0.5,
  };

  it("is false for a geyser as the game rolled it", () => {
    expect(isBestCase(rolls)).toBe(false);
  });

  it("is true once the best case has been applied", () => {
    expect(isBestCase({ ...rolls, ...BEST_CASE_ROLLS })).toBe(true);
  });

  it.each(Object.keys(BEST_CASE_ROLLS))(
    "is false when only %s is short of it",
    (roll) => {
      const best = { ...rolls, ...BEST_CASE_ROLLS };
      expect(isBestCase({ ...best, [roll]: 0.5 })).toBe(false);
    },
  );

  // It ignores the two rolls the button does not set, so a geyser that is at
  // its best case does not un-grey the button when the reader drags one of them.
  it("ignores the eruption timings", () => {
    const best = { ...rolls, ...BEST_CASE_ROLLS };
    expect(
      isBestCase({
        ...best,
        iterationLengthRoll: 0.2,
        iterationPercentRoll: 1,
      }),
    ).toBe(true);
  });
});

describe("formatting", () => {
  it("writes seconds whole", () => {
    expect(formatSeconds(79.31, t)).toBe("79 [geyser.seconds]");
  });

  it("writes cycles to one decimal", () => {
    expect(formatCycles(91860, t)).toBe("153.1 [geyser.cycles]");
  });

  // GameUtil.AppendFormattedCycles switches at 100 seconds. Only the oil
  // fissure's full cycle is ever short enough to land on the other side.
  it("writes a duration over a hundred seconds in cycles", () => {
    expect(formatDuration(101, t)).toBe("0.2 [geyser.cycles]");
  });

  it("writes a duration under a hundred seconds in seconds", () => {
    expect(formatDuration(99, t)).toBe("99 [geyser.seconds]");
  });

  it("writes kelvin as celsius", () => {
    expect(formatTemperature(2500, t)).toBe("2226.9 [geyser.celsius]");
    expect(formatTemperature(273.15, t)).toBe("0 [geyser.celsius]");
  });
});

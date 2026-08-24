import { CountTranslator } from "./materials";

/** One game cycle, in seconds. */
export const SECONDS_PER_CYCLE = 600;

/** Absolute zero, for turning the game's kelvin into something readable. */
const KELVIN_OFFSET = 273.15;

/**
 * What a geyser of a given type is allowed to roll.
 *
 * Lifted from `GeyserGenericConfig.GenerateConfigs()` in the decompiled
 * assembly - every geyser in the game is one call to the `GeyserType`
 * constructor, and these are its arguments. The save stores only the five
 * rolls, each a number from 0 to 1; without these ranges a roll means nothing,
 * which is why the page could previously only show percentages.
 */
export interface GeyserTypeInfo {
  /** `SimHashes` id of the emitted element, for looking up its name. */
  element: string;
  /** Temperature of the emitted element, in kelvin. */
  temperature: number;
  /** Kilograms emitted per cycle of eruption. */
  minRate: number;
  maxRate: number;
  /** Seconds from the start of one eruption to the start of the next. */
  minIterationLength: number;
  maxIterationLength: number;
  /** Share of that spent actually erupting. */
  minIterationPercent: number;
  maxIterationPercent: number;
  /** Seconds from the start of one active period to the start of the next. */
  minYearLength: number;
  maxYearLength: number;
  /** Share of that spent active rather than dormant. */
  minYearPercent: number;
  maxYearPercent: number;
}

type Timings = Pick<
  GeyserTypeInfo,
  | "minIterationLength"
  | "maxIterationLength"
  | "minIterationPercent"
  | "maxIterationPercent"
  | "minYearLength"
  | "maxYearLength"
  | "minYearPercent"
  | "maxYearPercent"
>;

/** The `GeyserType` constructor's default arguments. */
const DEFAULT_TIMINGS: Timings = {
  minIterationLength: 60,
  maxIterationLength: 1140,
  minIterationPercent: 0.1,
  maxIterationPercent: 0.9,
  minYearLength: 15000,
  maxYearLength: 135000,
  minYearPercent: 0.4,
  maxYearPercent: 0.8,
};

/** `GeyserGenericConfig.ITERATIONS.INFREQUENT_MOLTEN` - the volcanoes. */
const INFREQUENT_MOLTEN = {
  minIterationLength: 6000,
  maxIterationLength: 12000,
  minIterationPercent: 0.005,
  maxIterationPercent: 0.01,
};

/** `GeyserGenericConfig.ITERATIONS.FREQUENT_MOLTEN` - the metal volcanoes. */
const FREQUENT_MOLTEN = {
  minIterationLength: 480,
  maxIterationLength: 1080,
  minIterationPercent: 1 / 60,
  maxIterationPercent: 0.1,
};

function geyserType(
  element: string,
  temperature: number,
  minRate: number,
  maxRate: number,
  timings: Partial<Timings> = {},
): GeyserTypeInfo {
  return {
    element,
    temperature,
    minRate,
    maxRate,
    ...DEFAULT_TIMINGS,
    ...timings,
  };
}

/**
 * Every type the game can place, keyed the way the save names them.
 *
 * Kept in the game's own declaration order so the two can be read side by side
 * when a game update adds one.
 */
export const GEYSER_TYPES: Record<string, GeyserTypeInfo> = {
  steam: geyserType("Steam", 383.15, 1000, 2000),
  hot_steam: geyserType("Steam", 773.15, 500, 1000),
  hot_water: geyserType("Water", 368.15, 2000, 4000),
  slush_water: geyserType("DirtyWater", 263.15, 1000, 2000),
  filthy_water: geyserType("DirtyWater", 303.15, 2000, 4000),
  slush_salt_water: geyserType("Brine", 263.15, 1000, 2000),
  salt_water: geyserType("SaltWater", 368.15, 2000, 4000),
  small_volcano: geyserType("Magma", 2000, 400, 800, INFREQUENT_MOLTEN),
  big_volcano: geyserType("Magma", 2000, 800, 1600, INFREQUENT_MOLTEN),
  liquid_co2: geyserType("LiquidCarbonDioxide", 218, 100, 200),
  hot_co2: geyserType("CarbonDioxide", 773.15, 70, 140),
  hot_hydrogen: geyserType("Hydrogen", 773.15, 70, 140),
  hot_po2: geyserType("ContaminatedOxygen", 773.15, 70, 140),
  slimy_po2: geyserType("ContaminatedOxygen", 333.15, 70, 140),
  chlorine_gas: geyserType("ChlorineGas", 333.15, 70, 140),
  chlorine_gas_cool: geyserType("ChlorineGas", 278.15, 70, 140),
  methane: geyserType("Methane", 423.15, 70, 140),
  molten_copper: geyserType("MoltenCopper", 2500, 200, 400, FREQUENT_MOLTEN),
  molten_iron: geyserType("MoltenIron", 2800, 200, 400, FREQUENT_MOLTEN),
  molten_gold: geyserType("MoltenGold", 2900, 200, 400, FREQUENT_MOLTEN),
  molten_aluminum: geyserType(
    "MoltenAluminum",
    2000,
    200,
    400,
    FREQUENT_MOLTEN,
  ),
  molten_tungsten: geyserType(
    "MoltenTungsten",
    4000,
    200,
    400,
    FREQUENT_MOLTEN,
  ),
  molten_niobium: geyserType(
    "MoltenNiobium",
    3500,
    800,
    1600,
    INFREQUENT_MOLTEN,
  ),
  molten_cobalt: geyserType("MoltenCobalt", 2500, 200, 400, FREQUENT_MOLTEN),
  // The oil fissure drips continuously: it is always erupting (100% of a
  // 600 second iteration) and its full cycle is measured in seconds.
  oil_drip: geyserType("CrudeOil", 600, 1, 250, {
    minIterationLength: 600,
    maxIterationLength: 600,
    minIterationPercent: 1,
    maxIterationPercent: 1,
    minYearLength: 100,
    maxYearLength: 500,
  }),
  liquid_sulfur: geyserType("LiquidSulfur", 438.35, 1000, 2000),
  murky_brine: geyserType("MurkyBrine", 368.15, 2000, 4000),
};

export function geyserTypeInfo(geyserType: string): GeyserTypeInfo | null {
  return GEYSER_TYPES[geyserType] ?? null;
}

// The two constants in `GeyserConfigurator.Resample`. The epsilon is the
// inverse-logit of the steepness, so a roll of 0 lands exactly on min and a
// roll of 1 exactly on max.
const RESAMPLE_STEEPNESS = 6;
const RESAMPLE_EPSILON = 0.002472623;

/**
 * Turns a stored 0-1 roll into the value the game plays with.
 *
 * `GeyserConfigurator.Resample`, which is a logit curve rather than a straight
 * line: 0.5 lands at the midpoint, but rolls bunch towards the middle of the
 * range, so a roll of 0.75 is only about 70% of the way up. Reproduced here
 * rather than approximated because the save also stores the game's own scaled
 * values, and the spec checks these against them.
 */
export function resampleRoll(roll: number, min: number, max: number): number {
  const t = roll * (1 - RESAMPLE_EPSILON * 2) + RESAMPLE_EPSILON;
  return (
    ((-Math.log(1 / t - 1) + RESAMPLE_STEEPNESS) / (RESAMPLE_STEEPNESS * 2)) *
      (max - min) +
    min
  );
}

/**
 * The inverse: which roll produces this value.
 *
 * Needed because the sliders are now in real units - the reader drags kilograms
 * and the save stores a roll.
 */
export function rollForValue(value: number, min: number, max: number): number {
  // The oil fissure pins two of its ranges to a single value, which has no
  // gradient to invert. Any roll gives the same result, so pick one.
  if (max === min) {
    return 0;
  }

  const fraction = clamp((value - min) / (max - min), 0, 1);

  // The logit is asymptotic, so inverting an endpoint lands a rounding error
  // away from it rather than on it. Dragging a slider to its stop should store
  // the roll the game reads back as exactly min or max, not 1.6e-10 off.
  if (fraction === 0 || fraction === 1) {
    return fraction;
  }

  const t = 1 / (1 + Math.exp(RESAMPLE_STEEPNESS * (1 - 2 * fraction)));
  return clamp((t - RESAMPLE_EPSILON) / (1 - RESAMPLE_EPSILON * 2), 0, 1);
}

/** The five numbers a save stores for one geyser. */
export interface GeyserRolls {
  rateRoll: number;
  iterationLengthRoll: number;
  iterationPercentRoll: number;
  yearLengthRoll: number;
  yearPercentRoll: number;
}

/** What those rolls actually mean, in the units the game shows. */
export interface GeyserReadout {
  /** Seconds from the start of one eruption to the start of the next. */
  iterationLength: number;
  /** Share of that spent erupting. */
  iterationPercent: number;
  /** Seconds of it spent erupting. */
  onDuration: number;
  /** Seconds from the start of one active period to the start of the next. */
  yearLength: number;
  /** Share of that spent active. */
  yearPercent: number;
  /** Seconds of it spent active. */
  yearOnDuration: number;
  /** Kilograms per cycle of eruption - the stored output roll, unrolled. */
  massPerCycle: number;
  /** Kilograms per second while actually erupting. */
  emitRate: number;
  /** Kilograms per second averaged over eruption and dormancy alike. */
  averageEmission: number;
}

/**
 * Everything the game's own panel prints, derived from the rolls.
 *
 * Only three of these are stored: `iterationLength`, `yearLength` and
 * `massPerCycle` each come from one roll and one range. The two rates are
 * computed, which is why dragging the erupting share moves `emitRate` without
 * anyone touching the output slider. Mirrors `GetEmitRate` and
 * `GetAverageEmission` on `GeyserInstanceConfiguration`.
 */
export function geyserReadout(
  info: GeyserTypeInfo,
  rolls: GeyserRolls,
): GeyserReadout {
  const iterationLength = resampleRoll(
    rolls.iterationLengthRoll,
    info.minIterationLength,
    info.maxIterationLength,
  );
  const iterationPercent = resampleRoll(
    rolls.iterationPercentRoll,
    info.minIterationPercent,
    info.maxIterationPercent,
  );
  const yearLength = resampleRoll(
    rolls.yearLengthRoll,
    info.minYearLength,
    info.maxYearLength,
  );
  const yearPercent = resampleRoll(
    rolls.yearPercentRoll,
    info.minYearPercent,
    info.maxYearPercent,
  );
  const massPerCycle = resampleRoll(rolls.rateRoll, info.minRate, info.maxRate);

  return {
    iterationLength,
    iterationPercent,
    onDuration: iterationLength * iterationPercent,
    yearLength,
    yearPercent,
    yearOnDuration: yearLength * yearPercent,
    massPerCycle,
    emitRate: massPerCycle / (SECONDS_PER_CYCLE * iterationPercent),
    averageEmission: (massPerCycle * yearPercent) / SECONDS_PER_CYCLE,
  };
}

/**
 * The rolls that make a geyser as useful as it can be.
 *
 * Output and active share go to their maximum because those are the only two
 * values in `averageEmission`. The full cycle goes to its *minimum*, which
 * adds nothing to the average - it shortens the dormant stretch, so the storage
 * needed to ride one out shrinks with it. The eruption timings are left alone:
 * they decide how bursty the flow is, and neither end of that is better.
 */
export const BEST_CASE_ROLLS: Partial<GeyserRolls> = {
  rateRoll: 1,
  yearPercentRoll: 1,
  yearLengthRoll: 0,
};

/**
 * Whether there is nothing left for the best case to do.
 *
 * Derived from `BEST_CASE_ROLLS` rather than listing the three rolls again, so
 * the check cannot fall out of step with what the button sets. Exact equality
 * is safe: `rollForValue` returns exactly 0 and 1 at the ends of a range, so a
 * slider dragged to its stop stores the same number the button writes.
 */
export function isBestCase(rolls: GeyserRolls): boolean {
  return Object.entries(BEST_CASE_ROLLS).every(
    ([roll, best]) => rolls[roll as keyof GeyserRolls] === best,
  );
}

/** Seconds, the way `GameUtil.GetFormattedTime` writes them. */
export function formatSeconds(seconds: number, t: CountTranslator): string {
  return t("geyser.seconds", { count: Math.round(seconds) });
}

/** Cycles, one decimal. */
export function formatCycles(seconds: number, t: CountTranslator): string {
  return t("geyser.cycles", {
    count: roundToTenth(seconds / SECONDS_PER_CYCLE),
  });
}

/**
 * `GameUtil.AppendFormattedCycles`: anything over 100 seconds reads in cycles,
 * anything shorter in seconds. Only the oil fissure's full cycle is ever
 * short enough for the difference to show.
 */
export function formatDuration(seconds: number, t: CountTranslator): string {
  return Math.abs(seconds) > 100
    ? formatCycles(seconds, t)
    : formatSeconds(seconds, t);
}

/** Kelvin as degrees celsius, which is what the game shows by default. */
export function formatTemperature(kelvin: number, t: CountTranslator): string {
  return t("geyser.celsius", { count: roundToTenth(kelvin - KELVIN_OFFSET) });
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

import { TFunction } from "i18next";

/**
 * The amounts a duplicant carries, and what the game calls them.
 *
 * These are not attributes and not effects, and for a long time the editor
 * printed their raw ids because it looked for them in the wrong tables. The
 * game names them under `STRINGS.DUPLICANTS.STATS`, where `HitPoints` is
 * "Health" and `Temperature` is "Body Temperature" - now extracted into
 * `oni.json` by `tools/extract-translations.py`.
 */
export function statNameKey(amountId: string): string {
  return `oni:DUPLICANTS.STATS.${amountId.toUpperCase()}.NAME`;
}

export function statDescKey(amountId: string): string {
  return `oni:DUPLICANTS.STATS.${amountId.toUpperCase()}.DESC`;
}

export function diseaseNameKey(amountId: string): string {
  return `oni:DUPLICANTS.DISEASES.${amountId.toUpperCase()}.NAME`;
}

/**
 * The game's name where it has one, ours where it does not, the raw id where
 * neither does.
 *
 * Two tables, because the game keeps these in two: the resources a duplicant
 * spends are STATS, the germ counters are DISEASES. Five counters are in
 * neither - `Toxicity`, `ColdBrain`, `HeatRash`, `Spores` and `Sunburn` have
 * no string of their own anywhere in the catalogue - so those are ours.
 */
export function statName(amountId: string, t: TFunction): string {
  const fromStats = t(statNameKey(amountId), { defaultValue: "" });
  if (fromStats) {
    return fromStats;
  }
  const fromDiseases = t(diseaseNameKey(amountId), { defaultValue: "" });
  if (fromDiseases) {
    return fromDiseases;
  }
  return t(`duplicant_health.amounts.${amountId}`, { defaultValue: amountId });
}

/**
 * A big number with its thousands marked. Calories runs to seven digits and
 * "3536336.75" is unreadable next to a maximum written "4,000,000".
 */
export function formatAmount(value: number): string {
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(2));
  return rounded.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** Fitness, the numbers that keep a duplicant standing up. */
export const FITNESS_AMOUNTS = [
  "HitPoints",
  "Stamina",
  "Calories",
  "Breath",
  "Bladder",
];

export const MIND_AMOUNTS = ["Stress", "Decor"];

/** The one disease number that is a resource rather than a germ count. */
export const IMMUNITY_AMOUNT = "ImmuneLevel";

export const DISEASE_AMOUNTS = [
  "Toxicity",
  "FoodPoisoning",
  "SlimeLung",
  "ColdBrain",
  "HeatRash",
  "Sunburn",
  "PutridOdour",
  "Spores",
  "PollenGerms",
  "ZombieSpores",
  "RadiationSickness",
];

/**
 * What the editor treats as full.
 *
 * Nothing in the save records a maximum, so these are the scales the game's
 * own panel shows. Calories is the odd one, and the reason a duplicant reading
 * "3,536,337" needs the second number beside it to mean anything.
 */
const MAXIMA: Record<string, number> = {
  Calories: 4000000,
};

export const DEFAULT_MAXIMUM = 100;

export function amountMaximum(amountId: string): number {
  return MAXIMA[amountId] ?? DEFAULT_MAXIMUM;
}

/**
 * The value as the slider can show it.
 *
 * Clamped at both ends because neither end is guaranteed: Decor runs negative
 * when a duplicant is somewhere ugly, and Breath is stored above its own
 * maximum on at least one save the editor ships with. What is stored is left
 * alone - this only decides where the thumb sits.
 */
export function clampToScale(value: number, maximum: number): number {
  if (!(maximum > 0)) {
    return 0;
  }
  return Math.max(0, Math.min(maximum, value));
}

/**
 * What "heal and de-stress" sets each amount to, or undefined for the ones it
 * has no business touching - calories, bladder, decor, body temperature.
 *
 * The filling half never takes anything away: a duplicant carrying 200 breath
 * on a scale of 100 keeps it, because healing somebody is no reason to cut
 * them back to the maximum the editor happens to draw.
 */
export function healTarget(
  amountId: string,
  current: number,
): number | undefined {
  if (
    amountId === "HitPoints" ||
    amountId === "Breath" ||
    amountId === IMMUNITY_AMOUNT
  ) {
    return Math.max(current, amountMaximum(amountId));
  }
  if (amountId === "Stress" || DISEASE_AMOUNTS.indexOf(amountId) !== -1) {
    return 0;
  }
  return undefined;
}

/**
 * How far one nudge of a slider moves it.
 *
 * A whole unit on the amounts that run to a hundred, because nobody wants
 * 43.7291 stress. Calories runs to four million, where a step of one is a
 * thousand keystrokes to cross a pixel - so it steps in thousandths of the
 * scale, and the field beside it is there when a precise number is wanted.
 */
export function amountStep(maximum: number): number {
  return maximum > DEFAULT_MAXIMUM ? Math.round(maximum / 1000) : 1;
}

/**
 * Whether a value sits outside the scale it is drawn against.
 *
 * Worth marking rather than hiding: the bundled save has a duplicant at 200
 * breath on a scale of 100, which the old slider showed as "full" with the
 * handle pinned at the end.
 */
export function isOffScale(value: number, maximum: number): boolean {
  return value < 0 || value > maximum;
}

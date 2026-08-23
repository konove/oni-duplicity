import { SimHashNames } from "oni-save-parser";

// TODO: Seeds, clothing, other sweepables
export const MaterialGameObjectNames = [...SimHashNames];
export type MaterialObjectName = ArrayValues<typeof MaterialGameObjectNames>;

/** The subset of i18next's `t` this module needs, so it can be tested plainly. */
export type CountTranslator = (
  key: string,
  options: { count: number },
) => string;

/**
 * Formats a mass the way the game does.
 *
 * The save stores element mass in **kilograms** - `PrimaryElement.Units` on a
 * dirt pile in a real colony sums to 115,665, which the game shows as 115.6
 * tons. This was previously read as grams and divided again, so that colony's
 * dirt rendered as "115.67 kg": every mass in the editor was off by a thousand.
 *
 * The tiers mirror `GameUtil.AppendFormattedMass` under
 * `MetricMassFormat.UseThreshold`, read out of the decompiled assembly rather
 * than guessed - the boundaries are 5 and 5000, not 1 and 1000, which is why
 * the game shows 2,544 kg of algae in kilograms but 115,665 kg of dirt in tons.
 * Zero is kilograms there, not grams.
 */
export function formatMass(kilograms: number, t: CountTranslator): string {
  const magnitude = Math.abs(kilograms);

  if (magnitude === 0) {
    return t("material.kilogram", { count: 0 });
  }

  if (magnitude < 5e-6) {
    // The game floors this tier rather than rounding it.
    return t("material.microgram", { count: Math.floor(kilograms * 1e9) });
  }

  if (magnitude < 0.005) {
    return t("material.milligram", { count: round(kilograms * 1e6) });
  }

  if (magnitude < 5) {
    return t("material.gram", { count: round(kilograms * 1000) });
  }

  if (magnitude < 5000) {
    return t("material.kilogram", { count: round(kilograms) });
  }

  return t("material.tonne", { count: round(kilograms / 1000) });
}

/**
 * One decimal at most, trailing zero dropped - the game's `{0:0.#}`. Matching
 * it means a pile reads the same here as it does in the colony.
 */
function round(value: number): number {
  return Number(value.toFixed(1));
}

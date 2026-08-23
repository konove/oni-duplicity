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
 * Formats a mass for display.
 *
 * The save stores element mass in **kilograms** - `PrimaryElement.Units` on a
 * dirt pile in a real colony sums to 115,665, which the game shows as 115.6
 * tons. This was previously read as grams and divided again, so that colony's
 * dirt rendered as "115.67 kg": every mass in the editor was off by a factor of
 * a thousand.
 *
 * Units follow the game's own thresholds: grams below a kilogram, tonnes at a
 * thousand kilograms and above.
 */
export function formatMass(kilograms: number, t: CountTranslator): string {
  const magnitude = Math.abs(kilograms);

  if (magnitude < 1) {
    return t("material.gram", { count: round(kilograms * 1000) });
  }

  if (magnitude < 1000) {
    return t("material.kilogram", { count: round(kilograms) });
  }

  return t("material.tonne", { count: round(kilograms / 1000) });
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

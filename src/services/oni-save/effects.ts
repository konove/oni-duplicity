import { TFunction } from "i18next";

/** Effect display strings are keyed by the exact effect id. */
export function effectNameKey(effectId: string): string {
  return `oni:DUPLICANTS.EFFECTS.${effectId}.NAME`;
}

/**
 * The translated name, falling back to the raw id.
 *
 * Ten of the ids have no entry in the game's player-facing strings -
 * Hyperthermia and MentalBreak among them - so the fallback is load bearing
 * rather than defensive.
 */
export function effectName(effectId: string, t: TFunction): string {
  return t(effectNameKey(effectId), { defaultValue: effectId });
}

/**
 * Order effects the way they read on screen. As with traits and interests, the
 * ids rarely match their labels: `SoreBack` shows as "Sore Back" but
 * `RoomMessHall` shows as "Mess Hall" and `Decor5` as "Last Cycle's Decor:
 * Gorgeous".
 */
export function sortEffectsByName(
  effectIds: string[],
  t: TFunction,
  language?: string,
): string[] {
  const collator = new Intl.Collator(language, { sensitivity: "base" });
  return [...effectIds].sort((a, b) =>
    collator.compare(effectName(a, t), effectName(b, t)),
  );
}

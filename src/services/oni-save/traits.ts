import { TFunction } from "i18next";

/**
 * Trait display strings are keyed by the UPPERCASED trait id, which is not
 * always just the id shouted - see the parser's AI_TRAIT_IDS for the cases
 * where the game's own string key diverged.
 */
export function traitNameKey(traitId: string): string {
  return `oni:DUPLICANTS.TRAITS.${traitId.toUpperCase()}.NAME`;
}

export function traitDescKey(traitId: string): string {
  return `oni:DUPLICANTS.TRAITS.${traitId.toUpperCase()}.DESC`;
}

/** The translated name, falling back to the raw id for unknown traits. */
export function traitName(traitId: string, t: TFunction): string {
  return t(traitNameKey(traitId), { defaultValue: traitId });
}

/**
 * Order traits the way they read on screen.
 *
 * Sorting the ids instead would look arbitrary, because most of them differ
 * from their label: `Aggressive` displays as "Destructive" and `ConstructionUp`
 * as "Handy", so an id-sorted list lands them under the wrong letter entirely.
 *
 * Collated in the active language, since names are translated.
 */
export function sortTraitsByName<T>(
  traits: T[],
  traitIdOf: (item: T) => string,
  t: TFunction,
  language?: string,
): T[] {
  const collator = new Intl.Collator(language, { sensitivity: "base" });
  return [...traits].sort((a, b) =>
    collator.compare(traitName(traitIdOf(a), t), traitName(traitIdOf(b), t)),
  );
}

/** `sortTraitsByName` for a plain array of ids. */
export function sortTraitIdsByName(
  traitIds: string[],
  t: TFunction,
  language?: string,
): string[] {
  return sortTraitsByName(traitIds, (id) => id, t, language);
}

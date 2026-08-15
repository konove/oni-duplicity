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

export function traitEffectsKey(traitId: string): string {
  return `oni:DUPLICANTS.TRAITS.${traitId.toUpperCase()}.EFFECTS`;
}

/** The translated name, falling back to the raw id for unknown traits. */
export function traitName(traitId: string, t: TFunction): string {
  return t(traitNameKey(traitId), { defaultValue: traitId });
}

/**
 * The hover text for a trait: its flavour description followed by what it
 * actually does.
 *
 * The game assembles this the same way (Klei.AI.Trait.GetTooltip) - only the
 * description is a plain string, while the attribute modifiers, disabled
 * errands and effect immunities are built from the trait's data. Those lines
 * are extracted from the game and stored under EFFECTS.
 *
 * Not every trait has them: 41 of 146 do nothing a line can describe, or are
 * implemented purely as behaviour.
 */
export function traitTooltip(traitId: string, t: TFunction): string {
  const description = t(traitDescKey(traitId), { defaultValue: "" });

  // returnObjects gives back the array; a missing key yields the key itself.
  const effects = t(traitEffectsKey(traitId), {
    returnObjects: true,
    defaultValue: [],
  }) as unknown;

  const lines = Array.isArray(effects) ? (effects as string[]) : [];
  return [description, ...lines.map((line) => `• ${line}`)]
    .filter(Boolean)
    .join("\n");
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

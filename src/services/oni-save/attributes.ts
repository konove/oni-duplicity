import { TFunction } from "i18next";

/**
 * Attribute display strings are keyed by the exact attribute id, matching the
 * game's STRINGS.DUPLICANTS.ATTRIBUTES table.
 */
export function attributeNameKey(attributeId: string): string {
  return `oni:DUPLICANTS.ATTRIBUTES.${attributeId}.NAME`;
}

export function attributeDescKey(attributeId: string): string {
  return `oni:DUPLICANTS.ATTRIBUTES.${attributeId}.DESC`;
}

/** The translated name, falling back to the raw id for unknown attributes. */
export function attributeName(attributeId: string, t: TFunction): string {
  return t(attributeNameKey(attributeId), { defaultValue: attributeId });
}

/**
 * Order attributes the way they read on screen.
 *
 * The ids do not match their labels - `Digging` shows as "Excavation",
 * `Ranching` as "Husbandry", `SpaceNavigation` as "Piloting" - so sorting ids
 * would scatter the list.
 */
export function sortAttributesByName(
  attributeIds: string[],
  t: TFunction,
  language?: string,
): string[] {
  const collator = new Intl.Collator(language, { sensitivity: "base" });
  return [...attributeIds].sort((a, b) =>
    collator.compare(attributeName(a, t), attributeName(b, t)),
  );
}

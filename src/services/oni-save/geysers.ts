import { GeyserTypeNames } from "oni-save-parser";

/** The subset of i18next's `t` this module needs, so it can be tested plainly. */
export type NameTranslator = (
  key: string,
  options: { defaultValue: string },
) => string;

/** The game object group holding geysers of a given type. */
export function geyserGroupName(geyserType: string): string {
  return `GeyserGeneric_${geyserType}`;
}

export const GEYSER_GAMEOBJECT_TYPES = GeyserTypeNames.map(geyserGroupName);

/**
 * Geyser-like prefabs that are not generic geysers.
 *
 * The Aquatic Planet Pack's Tidal Spring and Thermal Gas Fissure have their
 * own prefab configs, and carry no `Geyser` behavior at all - no emission
 * rate, no cycle timings, nothing this editor could change. They are listed
 * here only so the page can say why a save that visibly has geysers shows
 * none, rather than rendering blank.
 */
export const UNEDITABLE_GEYSER_TYPES = ["SmallReefGeyser", "UnderwaterVent"];

/**
 * What the game calls this geyser - "Steam Vent" rather than `hot_steam`.
 *
 * Falls back to the raw type, which is what the page showed for every geyser
 * before the names were extracted from the game's catalogue.
 */
export function geyserDisplayName(
  geyserType: string,
  t: NameTranslator,
): string {
  return t(`oni:GEYSERS.${geyserType}.NAME`, { defaultValue: geyserType });
}

/** Every editable type, ordered the way a reader would look for them. */
export function geyserTypesByName(t: NameTranslator): string[] {
  return [...GeyserTypeNames].sort((a, b) =>
    geyserDisplayName(a, t).localeCompare(geyserDisplayName(b, t)),
  );
}

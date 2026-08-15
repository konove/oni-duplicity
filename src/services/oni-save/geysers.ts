import { GeyserTypeNames } from "oni-save-parser";

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

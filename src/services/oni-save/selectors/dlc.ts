import { createSelector } from "reselect";
import { DLCIds } from "oni-save-parser";

import { createServiceSelector } from "./utils";
import { saveGameSelector } from "./save-game";

/**
 * The content packs active in the loaded save, as an unordered set.
 *
 * The header has recorded this three different ways over the game's life:
 *
 * - before 7.28 there is no field at all
 * - 7.28 - 7.32 write a single `dlcId` string
 * - 7.34 on write a `dlcIds` array and leave `dlcId` explicitly `null`
 *
 * Read `dlcIds` first, since a modern save carries both.
 */
export const dlcIdsSelector = createServiceSelector(
  createSelector(saveGameSelector.local, (saveGame): string[] => {
    const gameInfo = saveGame?.header.gameInfo;
    if (!gameInfo) {
      return [];
    }

    if (gameInfo.dlcIds) {
      return gameInfo.dlcIds;
    }

    if (gameInfo.dlcId) {
      return [gameInfo.dlcId];
    }

    return [];
  }),
);

// Save data gives us plain strings, so widen the enum members to compare
// against them without reaching for a cast at every site.
const NO_DLC: string = DLCIds.None;
const VANILLA: string = DLCIds.Vanilla;

/**
 * True when the save has no content packs at all.
 *
 * `DLCIds.None` is the empty-string marker used for saves predating the DLC
 * field; the game's own base-game marker is `VANILLA_ID`. Both mean "base
 * game", as does an absent field, so all three land here.
 */
export function isBaseGameOnly(dlcIds: string[]): boolean {
  return dlcIds.every((id) => id === NO_DLC || id === VANILLA);
}

/**
 * Does this save have every one of `required` active?
 *
 * `DLCIds.None` is treated as "base game only" rather than as a member to look
 * up, so `requires(ids, DLCIds.None)` means what it reads like.
 */
export function hasDLCs(
  dlcIds: string[],
  required: string | string[],
): boolean {
  const wanted = Array.isArray(required) ? required : [required];
  return wanted.every((id) =>
    id === NO_DLC ? isBaseGameOnly(dlcIds) : dlcIds.indexOf(id) !== -1,
  );
}

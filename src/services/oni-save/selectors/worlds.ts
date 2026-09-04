import { createSelector } from "reselect";
import { getBehavior } from "@konove/oni-save-parser";

import { isNotNull } from "@/utils";

import { getGameObjectId } from "../utils";
import {
  WORLD_GAMEOBJECT_TYPE,
  WorldContainerBehavior,
  WorldRect,
} from "../worlds";

import { gameObjectGroupsSelector } from "./game-objects";
import { createServiceSelector } from "./utils";

/**
 * Every world in the save, in world id order.
 *
 * Empty for a base game save, which has no Asteroid objects: the colony is
 * the whole map and nothing needs placing. Rocket interiors are worlds too
 * and stay in - a duplicant in flight is on one.
 */
export const worldsSelector = createServiceSelector(
  createSelector(gameObjectGroupsSelector.local, (groups): WorldRect[] => {
    const asteroids = groups?.find((g) => g.name === WORLD_GAMEOBJECT_TYPE);
    if (!asteroids) {
      return [];
    }

    return asteroids.gameObjects
      .map((gameObject): WorldRect | null => {
        const gameObjectId = getGameObjectId(gameObject);
        const container = getBehavior(gameObject, WorldContainerBehavior);
        if (gameObjectId == null || !container) {
          return null;
        }
        const { templateData } = container;
        return { gameObjectId, id: templateData.id, templateData };
      })
      .filter(isNotNull)
      .sort((a, b) => a.id - b.id);
  }),
);

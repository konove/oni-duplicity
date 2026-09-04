import * as React from "react";
import { useSelector } from "react-redux";

import { gameObjectsByIdSelector } from "../selectors/game-objects";
import { worldsSelector } from "../selectors/worlds";
import { WorldGroup, groupGameObjectsByWorld } from "../worlds";

/**
 * The given objects split by the asteroid each sits on.
 *
 * One group, under no world, for a base game save or any save with a single
 * world - which is what lets a list page decide whether to show a world
 * picker at all without asking about content packs.
 */
export default function useGameObjectWorlds(
  gameObjectIds: number[],
): WorldGroup[] {
  const worlds = useSelector(worldsSelector);
  const gameObjectsById = useSelector(gameObjectsByIdSelector);

  return React.useMemo(
    () =>
      groupGameObjectsByWorld(
        worlds,
        gameObjectIds.map((gameObjectId) => ({
          gameObjectId,
          position: gameObjectsById[gameObjectId]?.position,
        })),
      ),
    [worlds, gameObjectsById, gameObjectIds],
  );
}

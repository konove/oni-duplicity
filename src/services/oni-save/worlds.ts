import {
  GameObjectBehavior,
  BehaviorName,
  Vector3,
} from "@konove/oni-save-parser";

import { NameTranslator } from "./geysers";

/**
 * Spaced Out! models each asteroid in the cluster as one game object in the
 * `Asteroid` group, carrying a `WorldContainer` behavior. A single save holds
 * the whole cluster.
 *
 * The parser has no typed behavior for this - it does not need one, since the
 * save carries its own templates - so the shape below is declared here, read
 * off real 7.36 and 7.38 saves. Only the fields the editor touches are named;
 * everything else in the behavior still round trips untouched.
 */
export const WORLD_GAMEOBJECT_TYPE = "Asteroid";

export const WorldContainerBehavior: BehaviorName<WorldContainerBehavior> =
  "WorldContainer";

export interface WorldContainerBehavior extends GameObjectBehavior {
  name: "WorldContainer";
  templateData: {
    id: number;

    /** Namespaced, e.g. "dlc4::worlds/PrehistoricClassicAsteroid". */
    worldName: string;

    /** Player-supplied rename. Empty when the world still uses `worldName`. */
    overrideName: string;

    /** Translation key, e.g. "STRINGS.WORLDS.PREHISTORICCLASSIC.NAME". */
    worldType: string;

    /**
     * Worlds tile into one global grid rather than each having their own
     * coordinate space, so a world owns the rect at `worldOffset` of size
     * `worldSize`. This is the only thing tying a game object to a world -
     * there is no per-object world id.
     */
    worldOffset: { x: number; y: number };
    worldSize: { x: number; y: number };

    isStartWorld: boolean;
    isModuleInterior: boolean;
    isDiscovered: boolean;
    isDupeVisited: boolean;
    isRoverVisited: boolean;
    isSurfaceRevealed: boolean;

    sunlight: number;
    cosmicRadiation: number;
  };
}

/**
 * The cluster-wide state, a behavior on the singleton `SaveGame` object.
 */
export const ClusterManagerBehavior: BehaviorName<ClusterManagerBehavior> =
  "ClusterManager";

export interface ClusterManagerBehavior extends GameObjectBehavior {
  name: "ClusterManager";
  templateData: {
    m_numRings: number;
    activeWorldIdx: number;
  };
}

/**
 * The display name for a world: the player's rename if they set one, else what
 * the game calls that kind of world ("Irradiated Forest Asteroid"), looked up
 * through the catalogue key the behavior carries in `worldType`. A world the
 * catalogue does not know falls back to the tail of its namespaced id.
 */
export function worldDisplayName(
  templateData: WorldContainerBehavior["templateData"] | null,
  t: NameTranslator,
): string {
  if (!templateData) {
    return "";
  }

  if (templateData.overrideName) {
    return templateData.overrideName;
  }

  const { worldName, worldType } = templateData;
  const fallback = worldName
    ? worldName.slice(worldName.lastIndexOf("/") + 1)
    : `World ${templateData.id}`;

  const match = /^STRINGS\.WORLDS\.([A-Z0-9_]+)\.NAME$/.exec(worldType ?? "");
  if (!match) {
    return fallback;
  }
  return t(`oni:WORLDS.${match[1]}.NAME`, { defaultValue: fallback });
}

/** One world, with the game object that carries it. */
export interface WorldRect {
  gameObjectId: number;
  id: number;
  templateData: WorldContainerBehavior["templateData"];
}

/**
 * The world whose rect contains the position, by `WorldContainer.id`.
 *
 * Rects are half open: worlds tile the grid edge to edge, so a position on the
 * far edge of one belongs to the next. Null off every world, which is where a
 * base game save's objects all are, since it has no worlds at all.
 */
export function worldIdForPosition(
  worlds: WorldRect[],
  position: Vector3 | undefined,
): number | null {
  if (!position) {
    return null;
  }
  for (const { id, templateData } of worlds) {
    const { worldOffset: offset, worldSize: size } = templateData;
    if (
      position.x >= offset.x &&
      position.x < offset.x + size.x &&
      position.y >= offset.y &&
      position.y < offset.y + size.y
    ) {
      return id;
    }
  }
  return null;
}

export interface WorldGroup {
  /** Null for objects that sit outside every world. */
  world: WorldRect | null;
  gameObjectIds: number[];
}

/**
 * The objects split by the world they sit on, in world order, each list in
 * the order given. Only worlds that hold at least one object get a group;
 * anything outside every world lands in a final group with no world.
 */
export function groupGameObjectsByWorld(
  worlds: WorldRect[],
  objects: Array<{ gameObjectId: number; position: Vector3 | undefined }>,
): WorldGroup[] {
  const byWorld = new Map<number | null, number[]>();
  for (const { gameObjectId, position } of objects) {
    const worldId = worldIdForPosition(worlds, position);
    const ids = byWorld.get(worldId) ?? [];
    ids.push(gameObjectId);
    byWorld.set(worldId, ids);
  }

  const groups: WorldGroup[] = [...worlds]
    .sort((a, b) => a.id - b.id)
    .filter((world) => byWorld.has(world.id))
    .map((world) => ({ world, gameObjectIds: byWorld.get(world.id)! }));

  const unplaced = byWorld.get(null);
  if (unplaced) {
    groups.push({ world: null, gameObjectIds: unplaced });
  }
  return groups;
}

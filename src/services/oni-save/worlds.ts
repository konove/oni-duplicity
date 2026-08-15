import { GameObjectBehavior, BehaviorName } from "oni-save-parser";

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
 * The display name for a world: the player's rename if they set one, else the
 * tail of the namespaced world name ("dlc4::worlds/PrehistoricClassicAsteroid"
 * becomes "PrehistoricClassicAsteroid").
 */
export function worldDisplayName(
  templateData: WorldContainerBehavior["templateData"] | null,
): string {
  if (!templateData) {
    return "";
  }

  if (templateData.overrideName) {
    return templateData.overrideName;
  }

  const { worldName } = templateData;
  if (!worldName) {
    return `World ${templateData.id}`;
  }

  return worldName.slice(worldName.lastIndexOf("/") + 1);
}

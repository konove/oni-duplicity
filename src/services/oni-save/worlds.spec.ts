import {
  WorldContainerBehavior,
  WorldRect,
  groupGameObjectsByWorld,
  worldDisplayName,
  worldIdForPosition,
} from "./worlds";

// The game's own catalogue, as `oni.json` carries it: the key is the tail of
// the behavior's `worldType`, "STRINGS.WORLDS.IDEALLANDINGSITE.NAME".
const CATALOGUE: Record<string, string> = {
  "oni:WORLDS.IDEALLANDINGSITE.NAME": "Irradiated Forest Asteroid",
};
const t = (key: string, options?: { defaultValue?: string }) =>
  CATALOGUE[key] ?? options?.defaultValue ?? key;

function world(
  overrides: Partial<WorldContainerBehavior["templateData"]>,
): WorldContainerBehavior["templateData"] {
  return {
    id: 1,
    worldName: "expansion1::worlds/IdealLandingSite",
    overrideName: "",
    worldType: "STRINGS.WORLDS.IDEALLANDINGSITE.NAME",
    worldOffset: { x: 244, y: 0 },
    worldSize: { x: 128, y: 153 },
    isStartWorld: false,
    isModuleInterior: false,
    isDiscovered: false,
    isDupeVisited: false,
    isRoverVisited: false,
    isSurfaceRevealed: false,
    sunlight: 30000,
    cosmicRadiation: 125,
    ...overrides,
  };
}

describe("worldDisplayName", () => {
  it("prefers the player's rename", () => {
    expect(worldDisplayName(world({ overrideName: "Home Base" }), t)).toBe(
      "Home Base",
    );
  });

  // The Worlds page used to print "IdealLandingSite", the tail of the
  // namespaced id, which is not a name the game ever shows the player.
  it("names an unrenamed world the way the game does", () => {
    expect(worldDisplayName(world({}), t)).toBe("Irradiated Forest Asteroid");
  });

  it("falls back to the id's tail when the catalogue has no entry", () => {
    const unknown = world({
      worldName: "dlc9::worlds/BrandNewAsteroid",
      worldType: "STRINGS.WORLDS.BRANDNEW.NAME",
    });
    expect(worldDisplayName(unknown, t)).toBe("BrandNewAsteroid");
  });

  it("numbers a world that has no name at all", () => {
    expect(
      worldDisplayName(world({ id: 3, worldName: "", worldType: "" }), t),
    ).toBe("World 3");
  });
});

const HOME: WorldRect = {
  gameObjectId: 3460660,
  id: 0,
  templateData: world({
    id: 0,
    overrideName: "Home Base",
    worldOffset: { x: 0, y: 0 },
    worldSize: { x: 160, y: 274 },
  }),
};
const LANDING: WorldRect = {
  gameObjectId: 3460662,
  id: 1,
  templateData: world({}),
};
const WORLDS = [HOME, LANDING];

describe("worldIdForPosition", () => {
  // The chlorine vent in the mock save, at (111.5, 125): inside the first
  // world's 160x274 rect and nowhere near the second.
  it("finds the world whose rect contains the position", () => {
    expect(worldIdForPosition(WORLDS, { x: 111.5, y: 125.01, z: -18.5 })).toBe(
      0,
    );
    expect(worldIdForPosition(WORLDS, { x: 300, y: 10, z: 0 })).toBe(1);
  });

  // Worlds tile the grid, so the far edge belongs to the next world over.
  it("treats the rect as half open", () => {
    expect(worldIdForPosition(WORLDS, { x: 0, y: 0, z: 0 })).toBe(0);
    expect(worldIdForPosition(WORLDS, { x: 160, y: 0, z: 0 })).toBe(null);
  });

  it("is null off every world, and without a position", () => {
    expect(worldIdForPosition(WORLDS, { x: 200, y: 10, z: 0 })).toBe(null);
    expect(worldIdForPosition(WORLDS, undefined)).toBe(null);
  });
});

describe("groupGameObjectsByWorld", () => {
  const objects = [
    { gameObjectId: 3, position: { x: 300, y: 10, z: 0 } },
    { gameObjectId: 1, position: { x: 10, y: 10, z: 0 } },
    { gameObjectId: 2, position: { x: 20, y: 20, z: 0 } },
  ];

  it("groups by world in world order, keeping each list's order", () => {
    expect(groupGameObjectsByWorld(WORLDS, objects)).toEqual([
      { world: HOME, gameObjectIds: [1, 2] },
      { world: LANDING, gameObjectIds: [3] },
    ]);
  });

  // A tab for a world with nothing on it would only say "not here".
  it("omits worlds that hold none of the objects", () => {
    expect(groupGameObjectsByWorld(WORLDS, objects.slice(1))).toEqual([
      { world: HOME, gameObjectIds: [1, 2] },
    ]);
  });

  // A base game save has no Asteroid objects at all; a Spaced Out object can
  // also sit outside every rect. Either way it is listed, under no world.
  it("keeps objects outside every world in a final unplaced group", () => {
    const stray = { gameObjectId: 9, position: { x: 200, y: 10, z: 0 } };
    expect(groupGameObjectsByWorld(WORLDS, [stray, ...objects])).toEqual([
      { world: HOME, gameObjectIds: [1, 2] },
      { world: LANDING, gameObjectIds: [3] },
      { world: null, gameObjectIds: [9] },
    ]);
    expect(groupGameObjectsByWorld([], objects)).toEqual([
      { world: null, gameObjectIds: [3, 1, 2] },
    ]);
  });
});

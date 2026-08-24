import { GameObjectGroup } from "oni-save-parser";

import { collectMaterials } from "./material";

/** The behaviours a loose element chunk carries in a real save. */
const CHUNK = ["KPrefabID", "PrimaryElement", "Pickupable", "Clearable"];
const SEED = [...CHUNK, "PlantableSeed"];
const FOOD = [...CHUNK, "Edible"];
const CRITTER = [...CHUNK, "CreatureBrain", "Health"];

interface FakeObject {
  behaviors: string[];
  units?: number;
  /** Material stored inside this object, as `{ name: units[] }`. */
  stores?: Record<string, number[]>;
  /** Behaviours for a stored thing that is not a plain pickupable. */
  storedBehaviors?: Record<string, string[]>;
}

const STORED_DEFAULT = ["KPrefabID", "Pickupable", "PrimaryElement"];

function group(name: string, objects: FakeObject[]): GameObjectGroup {
  return {
    name,
    gameObjects: objects.map(
      ({ behaviors, units = 0, stores, storedBehaviors }) => ({
        behaviors: [
          // Storage is appended below with its contents, so a caller naming it
          // in `behaviors` must not also get an empty one.
          ...behaviors
            .filter((behaviorName) => behaviorName !== "Storage")
            .map((behaviorName) =>
              behaviorName === "PrimaryElement"
                ? { name: "PrimaryElement", templateData: { Units: units } }
                : { name: behaviorName, templateData: {} },
            ),
          ...(stores
            ? [
                {
                  name: "Storage",
                  templateData: {},
                  extraData: Object.entries(stores).flatMap(
                    ([storedName, unitList]) =>
                      unitList.map((storedUnits) => ({
                        name: storedName,
                        behaviors: (
                          storedBehaviors?.[storedName] ?? STORED_DEFAULT
                        ).map((behaviorName) =>
                          behaviorName === "PrimaryElement"
                            ? {
                                name: "PrimaryElement",
                                templateData: { Units: storedUnits },
                              }
                            : { name: behaviorName, templateData: {} },
                        ),
                      })),
                  ),
                },
              ]
            : []),
        ],
      }),
    ),
  } as unknown as GameObjectGroup;
}

function rowFor(groups: GameObjectGroup[], name: string) {
  return collectMaterials(groups).find((row) => row.name === name);
}

describe("collectMaterials", () => {
  it("weighs a loose element and counts the clumps", () => {
    // Two of the 176 shale chunks in a real colony.
    const groups = [
      group("Shale", [
        { behaviors: CHUNK, units: 748.2017822265625 },
        { behaviors: CHUNK, units: 423.76995849609375 },
      ]),
    ];

    expect(rowFor(groups, "Shale")).toMatchObject({
      kind: "element",
      measure: "mass",
      looseUnits: 748.2017822265625 + 423.76995849609375,
      looseObjects: 2,
    });
  });

  // 0.8: the page carried `// TODO: Seeds, clothing, other sweepables` and
  // listed none of them, so nine seed types in a colony were simply absent.
  it("lists the sweepables the page used to drop", () => {
    const groups = [
      group("SeaLettuceSeed", [
        { behaviors: SEED, units: 2 },
        { behaviors: SEED, units: 1 },
      ]),
    ];

    expect(rowFor(groups, "SeaLettuceSeed")).toMatchObject({
      kind: "seed",
      measure: "count",
      looseUnits: 3,
      looseObjects: 2,
    });
  });

  it("measures food in calories", () => {
    const groups = [group("Meat", [{ behaviors: FOOD, units: 14.5 }])];
    expect(rowFor(groups, "Meat")).toMatchObject({
      kind: "food",
      measure: "calories",
      looseUnits: 14.5,
    });
  });

  it("leaves critters off a materials page", () => {
    const groups = [group("Chameleon", [{ behaviors: CRITTER, units: 1 }])];
    expect(collectMaterials(groups)).toEqual([]);
  });

  // A trap or a grooming station holds a live critter in its Storage, and the
  // page would otherwise list "Chameleon" as a stored material.
  it("leaves critters off even when something is holding one", () => {
    const groups = [
      group("CritterTrap", [
        {
          behaviors: ["KPrefabID"],
          stores: { Shale: [10], Chameleon: [1] },
          storedBehaviors: { Chameleon: CRITTER },
        },
      ]),
    ];

    expect(rowFor(groups, "Chameleon")).toBeUndefined();
    expect(rowFor(groups, "Shale")).toMatchObject({ storedUnits: 10 });
  });

  it("counts material inside containers separately from loose piles", () => {
    const groups = [
      group("Shale", [{ behaviors: CHUNK, units: 100 }]),
      group("StorageLocker", [
        { behaviors: ["KPrefabID"], stores: { Shale: [50] } },
      ]),
    ];

    expect(rowFor(groups, "Shale")).toMatchObject({
      looseUnits: 100,
      looseObjects: 1,
      storedUnits: 50,
      storedContainers: 1,
    });
  });

  // The count is of containers, so two stacks in one locker is one container.
  // It used to count stored stacks and call them containers.
  it("counts a container once however many stacks it holds", () => {
    const groups = [
      group("StorageLocker", [
        { behaviors: ["KPrefabID"], stores: { Shale: [50, 30, 20] } },
      ]),
    ];

    expect(rowFor(groups, "Shale")).toMatchObject({
      storedUnits: 100,
      storedContainers: 1,
    });
  });

  it("counts each container that holds some", () => {
    const groups = [
      group("StorageLocker", [
        { behaviors: ["KPrefabID"], stores: { Shale: [50] } },
        { behaviors: ["KPrefabID"], stores: { Shale: [30] } },
        { behaviors: ["KPrefabID"], stores: { Dirt: [10] } },
      ]),
    ];

    expect(rowFor(groups, "Shale")).toMatchObject({ storedContainers: 2 });
    expect(rowFor(groups, "Dirt")).toMatchObject({ storedContainers: 1 });
  });

  // An atmo suit is material a colony sweeps *and* a container holding oxygen.
  it("reads an object that is both material and container as both", () => {
    const groups = [
      group("Atmo_Suit", [
        {
          behaviors: [...CHUNK, "Equippable", "Storage"],
          units: 1,
          stores: { Oxygen: [12] },
        },
      ]),
    ];

    expect(rowFor(groups, "Atmo_Suit")).toMatchObject({
      kind: "equipment",
      measure: "count",
      looseUnits: 1,
    });
    expect(rowFor(groups, "Oxygen")).toMatchObject({
      storedUnits: 12,
      storedContainers: 1,
    });
  });

  it("sorts rows by name", () => {
    const groups = [
      group("Shale", [{ behaviors: CHUNK, units: 1 }]),
      group("Dirt", [{ behaviors: CHUNK, units: 1 }]),
    ];
    expect(collectMaterials(groups).map((row) => row.name)).toEqual([
      "Dirt",
      "Shale",
    ]);
  });
});

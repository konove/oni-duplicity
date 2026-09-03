import { SimHashNames } from "@konove/oni-save-parser";

import {
  isMaterialGroup,
  materialKind,
  materialMeasure,
  looseObjectKey,
  countKey,
  kindKey,
  foodCalories,
  formatCalories,
  formatQuantity,
  MaterialGameObjectNames,
  elementDisplayName,
  materialDisplayName,
  formatMass,
} from "./materials";
import {
  ELEMENTS as CATALOGUE,
  ITEMS as ITEMS_CATALOGUE,
} from "@/translations/en/oni.json";
import CATALOGUE_ROOT from "@/translations/en/oni.json";

// The JSON resolves to a literal type with one key per entry; the tests index
// both groups by an id computed at runtime.
const ELEMENTS: Record<string, { NAME: string } | undefined> = CATALOGUE;
const ITEMS: Record<string, { NAME: string } | undefined> = ITEMS_CATALOGUE;

// The formatter records both the unit and the number, since the bug it fixes
// was a plausible-looking number under the wrong unit.
const t = (key: string, { count }: { count: number }) => `${key}:${count}`;

// Boundaries come from GameUtil.AppendFormattedMass under
// MetricMassFormat.UseThreshold, not from SI convention: the game switches at
// 5 and 5000, and calls zero kilograms.
describe("formatMass", () => {
  it("matches the game on a real colony's dirt", () => {
    // 115,665 kg, which the game shows as 115.6 tons.
    expect(formatMass(115665.18, t)).toBe("material.tonne:115.7");
  });

  it("matches the game on a real colony's algae", () => {
    // 2,544 kg stays in kilograms because it is under five tonnes.
    expect(formatMass(2544, t)).toBe("material.kilogram:2544");
  });

  it("switches to tonnes at five thousand kilograms, not one", () => {
    expect(formatMass(4999, t)).toBe("material.kilogram:4999");
    expect(formatMass(5000, t)).toBe("material.tonne:5");
  });

  it("switches to grams below five kilograms, not one", () => {
    expect(formatMass(4.9, t)).toBe("material.gram:4900");
    expect(formatMass(5, t)).toBe("material.kilogram:5");
  });

  it("uses milligrams and micrograms below that", () => {
    expect(formatMass(0.004, t)).toBe("material.milligram:4000");
    expect(formatMass(0.000004, t)).toBe("material.microgram:4000");
  });

  it("calls zero kilograms, as the game does", () => {
    expect(formatMass(0, t)).toBe("material.kilogram:0");
  });

  it("keeps at most one decimal, like the game's {0:0.#}", () => {
    expect(formatMass(1.23456, t)).toBe("material.gram:1234.6");
    expect(formatMass(2635.83, t)).toBe("material.kilogram:2635.8");
  });

  it("handles negative masses without changing unit choice", () => {
    expect(formatMass(-6000, t)).toBe("material.tonne:-6");
  });
});

// The Materials page can only show a material the parser can name. When the
// enum knew 149 of the game's 212 elements, everything else was absent from the
// table rather than reported as unknown - 285.4 t on one real colony, most of it
// shale. These guard the two halves of that: the ids, and their names.
describe("MaterialGameObjectNames", () => {
  it("covers every element the parser knows", () => {
    expect(MaterialGameObjectNames).toHaveLength(SimHashNames.length);
  });

  // Measured missing from a real colony: Shale 197.4 t, NickelOre 44.1 t,
  // Peat 43.9 t. Named individually so a regression says what went missing.
  it.each(["Shale", "NickelOre", "Peat"])("lists %s", (element) => {
    expect(MaterialGameObjectNames).toContain(element);
  });

  it("lists the elements the later DLCs added", () => {
    expect(MaterialGameObjectNames).toEqual(
      expect.arrayContaining(["MoltenCobalt", "MurkyBrine", "Iridium", "Zinc"]),
    );
  });
});

describe("elementDisplayName", () => {
  const named = (key: string, { defaultValue }: { defaultValue: string }) => {
    const element = key.replace(/^oni:ELEMENTS\.|\.NAME$/g, "");
    return ELEMENTS[element]?.NAME ?? defaultValue;
  };

  it("uses the game's own name", () => {
    expect(elementDisplayName("NickelOre", named)).toBe("Nickel Ore");
    expect(elementDisplayName("MurkyBrine", named)).toBe("Polluted Brine");
  });

  // Re-pinning the parser forward without re-running extract-translations.py
  // would put ids back on the page. This is the test that says so.
  it("has a catalogue name for every element the parser knows", () => {
    const unnamed = SimHashNames.filter((element) => !ELEMENTS[element]);
    expect(unnamed).toEqual([]);
  });

  // Only reachable if the catalogue falls behind the enum, which the test above
  // exists to prevent - but an id split into words still beats a raw id.
  it("splits an id it has no name for", () => {
    expect(elementDisplayName("MoltenUnobtainium", named)).toBe(
      "Molten Unobtainium",
    );
  });
});

// Behaviour lists copied verbatim out of a real colony, so the classifier is
// tested against what saves actually contain rather than an idea of it.
const SHALE = [
  "KPrefabID",
  "PrimaryElement",
  "Pickupable",
  "StateMachineController",
  "Clearable",
  "Prioritizable",
  "Klei.AI.Modifiers",
  "Movable",
  "KCircleCollider2D",
];
const SALT_WATER = [
  "KPrefabID",
  "PrimaryElement",
  "Pickupable",
  "StateMachineController",
  "Clearable",
  "Prioritizable",
  "Klei.AI.Modifiers",
  "Movable",
  "KBoxCollider2D",
  "Dumpable",
];
const CHAMELEON = [
  "KPrefabID",
  "StateMachineController",
  "PrimaryElement",
  "KBoxCollider2D",
  "Klei.AI.Modifiers",
  "Pickupable",
  "Clearable",
  "Klei.AI.Traits",
  "Health",
  "RangedAttackable",
  "FactionAlignment",
  "Prioritizable",
  "Klei.AI.Effects",
  "AnimEventHandler",
  "SymbolOverrideController",
  "DrowningMonitor",
  "Butcherable",
  "Navigator",
  "Trappable",
  "Weapon",
  "Baggable",
  "Capturable",
  "Movable",
  "CreatureBrain",
  "ChoreConsumer",
  "CaloriesConsumedElementProducer",
  "Facing",
  "ChoreDriver",
  "User",
];
const MINION = [
  "KPrefabID",
  "StateMachineController",
  "MinionModifiers",
  "MinionBrain",
  "Storage",
  "Health",
  "MinionIdentity",
  "Navigator",
  "KBoxCollider2D",
  "PrimaryElement",
  "Pickupable",
  "Clearable",
  "Prioritizable",
];
const SEED = [
  "KPrefabID",
  "StateMachineController",
  "PrimaryElement",
  "KCircleCollider2D",
  "Klei.AI.Modifiers",
  "Pickupable",
  "Movable",
  "Compostable",
  "PlantableSeed",
  "MutantPlant",
  "Clearable",
  "Prioritizable",
];
const EGG = [
  "KPrefabID",
  "StateMachineController",
  "PrimaryElement",
  "KBoxCollider2D",
  "Klei.AI.Modifiers",
  "Pickupable",
  "Movable",
  "Klei.AI.Effects",
  "SymbolOverrideController",
  "Clearable",
  "Prioritizable",
];
const MEAT = [
  "KPrefabID",
  "StateMachineController",
  "PrimaryElement",
  "KBoxCollider2D",
  "Klei.AI.Modifiers",
  "Pickupable",
  "Movable",
  "Compostable",
  "Edible",
  "Clearable",
  "Prioritizable",
];
const SUIT = [
  "KPrefabID",
  "StateMachineController",
  "PrimaryElement",
  "KCircleCollider2D",
  "Klei.AI.Modifiers",
  "Pickupable",
  "Movable",
  "Equippable",
  "SuitTank",
  "HelmetController",
  "Durability",
  "Storage",
  "AtmoSuit",
  "Clearable",
  "Prioritizable",
];
const DATABANK = [
  "KPrefabID",
  "StateMachineController",
  "PrimaryElement",
  "KCircleCollider2D",
  "Klei.AI.Modifiers",
  "Pickupable",
  "Movable",
  "Clearable",
  "Prioritizable",
];

describe("isMaterialGroup", () => {
  it("accepts loose element chunks", () => {
    expect(isMaterialGroup(SHALE)).toBe(true);
    expect(isMaterialGroup(SALT_WATER)).toBe(true);
  });

  it("accepts the sweepables the page never listed", () => {
    expect(isMaterialGroup(SEED)).toBe(true);
    expect(isMaterialGroup(EGG)).toBe(true);
    expect(isMaterialGroup(MEAT)).toBe(true);
    expect(isMaterialGroup(DATABANK)).toBe(true);
  });

  // The whole reason a curated rule is needed: the largest pickupable group in
  // that colony was 57 chameleons, and a duplicant is pickupable too.
  it("rejects anything with a brain, however pickupable", () => {
    expect(isMaterialGroup(CHAMELEON)).toBe(false);
    expect(isMaterialGroup(MINION)).toBe(false);
  });

  it("rejects anything that cannot be picked up at all", () => {
    expect(isMaterialGroup(["KPrefabID", "PrimaryElement", "Storage"])).toBe(
      false,
    );
  });
});

describe("materialKind", () => {
  it("reads the kind off the behaviours the game gave the object", () => {
    expect(materialKind("DewDripperPlantSeed", SEED)).toBe("seed");
    expect(materialKind("Meat", MEAT)).toBe("food");
    expect(materialKind("Atmo_Suit", SUIT)).toBe("equipment");
  });

  it("calls a named element an element", () => {
    expect(materialKind("Shale", SHALE)).toBe("element");
    expect(materialKind("SaltWater", SALT_WATER)).toBe("element");
  });

  // An egg carries no behaviour a seed or a databank does not; the name is the
  // only thing separating them, and the game names them the same way.
  it("recognises an egg by name, having nothing else to go on", () => {
    expect(materialKind("ChameleonEgg", EGG)).toBe("egg");
  });

  it("falls back to a plain item", () => {
    expect(materialKind("OrbitalResearchDatabank", DATABANK)).toBe("item");
  });
});

describe("materialMeasure", () => {
  // The game's own three-way split: GameTags.MaterialCategories are mass,
  // CalorieCategories are kcal, UnitCategories are a plain count.
  it("weighs elements and counts everything else", () => {
    expect(materialMeasure("element")).toBe("mass");
    expect(materialMeasure("food")).toBe("calories");
    expect(materialMeasure("seed")).toBe("count");
    expect(materialMeasure("egg")).toBe("count");
    expect(materialMeasure("equipment")).toBe("count");
    expect(materialMeasure("item")).toBe("count");
  });
});

describe("looseObjectKey", () => {
  // The page called every loose pile a "clump", which is wrong for every
  // liquid in a colony: Salt Water lies on the floor in bottles.
  it("names a loose pile after the element's phase", () => {
    expect(looseObjectKey("element", "Shale")).toBe(
      "material_loose.clump_count",
    );
    expect(looseObjectKey("element", "SaltWater")).toBe(
      "material_loose.bottle_count",
    );
    expect(looseObjectKey("element", "ChlorineGas")).toBe(
      "material_loose.canister_count",
    );
  });

  // A counted material already says what it is in the amount - "31 seeds" -
  // so the line under it only has to say where they are.
  it("says only that a counted material is lying around", () => {
    expect(looseObjectKey("seed", "SeaLettuceSeed")).toBe(
      "material_loose.lying_around",
    );
    expect(looseObjectKey("egg", "ChameleonEgg")).toBe(
      "material_loose.lying_around",
    );
    expect(looseObjectKey("item", "OrbitalResearchDatabank")).toBe(
      "material_loose.lying_around",
    );
  });

  it("falls back to clumps for an element with no phase on record", () => {
    expect(looseObjectKey("element", "NotAnElement")).toBe(
      "material_loose.clump_count",
    );
  });
});

describe("countKey", () => {
  it("counts each kind in its own noun", () => {
    expect(countKey("seed")).toBe("material.seed_count");
    expect(countKey("egg")).toBe("material.egg_count");
    expect(countKey("item")).toBe("material.unit_count");
    expect(countKey("equipment")).toBe("material.unit_count");
  });
});

// Edible.Calories is `Units * foodInfo.CaloriesPerUnit`, and
// GameUtil.AppendFormattedCalories divides that by 1000 and calls it kcal.
describe("foodCalories", () => {
  it("multiplies the save's units by the game's rate", () => {
    // Seven Ovagro Figs at 325,000 each - the design's worked example.
    expect(foodCalories("VineFruit", 7)).toBe(2275000);
  });

  it("handles a real colony's 14.5 units of meat", () => {
    expect(foodCalories("Meat", 14.5)).toBe(23200000);
  });

  // FernFood really is 0f in TUNING.FOOD.FOOD_TYPES; the game hides it via
  // FoodInfo.Display rather than treating it as missing.
  it("reports the zero the game actually declares", () => {
    expect(foodCalories("FernFood", 3)).toBe(0);
  });

  it("gives up on a prefab the table has never heard of", () => {
    expect(foodCalories("NotAFood", 3)).toBeNull();
  });
});

describe("formatCalories", () => {
  it("shows kilocalories, as the game forces", () => {
    expect(formatCalories(2275000, t)).toBe("material.kilocalorie:2275");
  });

  // AppendStandardFloat keeps two decimals below ten and none above it.
  it("keeps decimals only under ten kilocalories", () => {
    expect(formatCalories(9600, t)).toBe("material.kilocalorie:9.6");
    expect(formatCalories(10400, t)).toBe("material.kilocalorie:10");
  });

  it("prints a plain zero", () => {
    expect(formatCalories(0, t)).toBe("material.kilocalorie:0");
  });
});

describe("formatQuantity", () => {
  it("weighs an element", () => {
    expect(formatQuantity("mass", "element", "Shale", 197400, t)).toBe(
      "material.tonne:197.4",
    );
  });

  it("counts a seed in seeds and an egg in eggs", () => {
    expect(formatQuantity("count", "seed", "SeaLettuceSeed", 31, t)).toBe(
      "material.seed_count:31",
    );
    expect(formatQuantity("count", "egg", "ChameleonEgg", 11, t)).toBe(
      "material.egg_count:11",
    );
  });

  it("turns food units into the kilocalories the game shows", () => {
    expect(formatQuantity("calories", "food", "VineFruit", 7, t)).toBe(
      "material.kilocalorie:2275",
    );
  });

  // A food the tuning table has never heard of still has to render something,
  // and a count of the things is true where a calorie count would be invented.
  it("counts a food it cannot price in calories", () => {
    expect(formatQuantity("calories", "food", "ModdedSnack", 4, t)).toBe(
      "material.unit_count:4",
    );
  });
});

describe("kindKey", () => {
  it("says which phase an element is, since the table mixes all three", () => {
    expect(kindKey("element", "Shale")).toBe("material.kind.solid_element");
    expect(kindKey("element", "SaltWater")).toBe(
      "material.kind.liquid_element",
    );
    expect(kindKey("element", "ChlorineGas")).toBe("material.kind.gas_element");
  });

  it("names the other kinds plainly", () => {
    expect(kindKey("seed", "SeaLettuceSeed")).toBe("material.kind.seed");
    expect(kindKey("food", "Meat")).toBe("material.kind.food");
    expect(kindKey("equipment", "Atmo_Suit")).toBe("material.kind.equipment");
    expect(kindKey("item", "OrbitalResearchDatabank")).toBe(
      "material.kind.item",
    );
  });
});

describe("materialDisplayName", () => {
  const name = (key: string, { defaultValue }: { defaultValue: string }) => {
    const path = key.replace(/^oni:/, "").split(".");
    const node = path.reduce<any>(
      (at, part) => (at == null ? at : at[part]),
      CATALOGUE_ROOT,
    );
    return typeof node === "string" ? node : defaultValue;
  };

  it("uses the game's own name for an element", () => {
    expect(materialDisplayName("SaltWater", "element", name)).toBe(
      "Salt Water",
    );
  });

  // The whole reason ITEMS exists. Splitting the id gave "Garden Forage Plant"
  // for something the game calls Snac Fruit, and "Garden Food Plant Food" for
  // Sweatcorn - not near misses, different words.
  it("uses the game's own name for a non-element", () => {
    expect(materialDisplayName("GardenForagePlant", "food", name)).toBe(
      "Snac Fruit",
    );
    expect(materialDisplayName("GardenFoodPlantFood", "food", name)).toBe(
      "Sweatcorn",
    );
    expect(materialDisplayName("GardenDecorPlantSeed", "seed", name)).toBe(
      "Rosebush Seed",
    );
    expect(materialDisplayName("ChameleonEgg", "egg", name)).toBe("Dartle Egg");
  });

  it("splits an id it has no name for, underscores included", () => {
    expect(materialDisplayName("ModdedSnack_Deluxe", "item", name)).toBe(
      "Modded Snack Deluxe",
    );
  });

  // Every material a real colony held, so a regression in the extraction shows
  // up here rather than on the page.
  it("names every material two real colonies contained", () => {
    const seen = [
      "GardenForagePlant",
      "GardenFoodPlantFood",
      "GardenDecorPlantSeed",
      "GardenFoodPlantSeed",
      "SeaLettuceSeed",
      "ChameleonEgg",
      "Atmo_Suit",
      "OrbitalResearchDatabank",
      "EggShell",
      "FarmStationTools",
      "artifact_blender",
    ];
    for (const id of seen) {
      expect(ITEMS[id]).toBeDefined();
    }
  });
});

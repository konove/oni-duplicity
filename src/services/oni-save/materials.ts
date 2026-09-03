import { SimHashNames } from "@konove/oni-save-parser";

import { ELEMENT_PHASES, ElementPhase } from "./element-phases";
import { FOOD_CALORIES_PER_UNIT } from "./food-calories";

// TODO: Seeds, clothing, other sweepables
export const MaterialGameObjectNames = [...SimHashNames];
export type MaterialObjectName = ArrayValues<typeof MaterialGameObjectNames>;

/** The subset of i18next's `t` this module needs, so it can be tested plainly. */
export type CountTranslator = (
  key: string,
  options: { count: number },
) => string;

/**
 * Formats a mass the way the game does.
 *
 * The save stores element mass in **kilograms** - `PrimaryElement.Units` on a
 * dirt pile in a real colony sums to 115,665, which the game shows as 115.6
 * tons. This was previously read as grams and divided again, so that colony's
 * dirt rendered as "115.67 kg": every mass in the editor was off by a thousand.
 *
 * The tiers mirror `GameUtil.AppendFormattedMass` under
 * `MetricMassFormat.UseThreshold`, read out of the decompiled assembly rather
 * than guessed - the boundaries are 5 and 5000, not 1 and 1000, which is why
 * the game shows 2,544 kg of algae in kilograms but 115,665 kg of dirt in tons.
 * Zero is kilograms there, not grams.
 */
export function formatMass(kilograms: number, t: CountTranslator): string {
  const magnitude = Math.abs(kilograms);

  if (magnitude === 0) {
    return t("material.kilogram", { count: 0 });
  }

  if (magnitude < 5e-6) {
    // The game floors this tier rather than rounding it.
    return t("material.microgram", { count: Math.floor(kilograms * 1e9) });
  }

  if (magnitude < 0.005) {
    return t("material.milligram", { count: round(kilograms * 1e6) });
  }

  if (magnitude < 5) {
    return t("material.gram", { count: round(kilograms * 1000) });
  }

  if (magnitude < 5000) {
    return t("material.kilogram", { count: round(kilograms) });
  }

  return t("material.tonne", { count: round(kilograms / 1000) });
}

/**
 * One decimal at most, trailing zero dropped - the game's `{0:0.#}`. Matching
 * it means a pile reads the same here as it does in the colony.
 */
function round(value: number): number {
  return Number(value.toFixed(1));
}

/** The subset of i18next's `t` a name lookup needs, so it can be tested plainly. */
export type NameTranslator = (
  key: string,
  options: { defaultValue: string },
) => string;

/**
 * What the game calls an element - "Molten Copper" rather than `MoltenCopper`.
 *
 * The extracted catalogue names 149 of the game's elements, so a few - Molten
 * Cobalt and Murky Brine among them - still have no entry. Splitting the id
 * reads better than printing it raw while that is true.
 */
export function elementDisplayName(
  elementId: string,
  t: NameTranslator,
): string {
  return t(`oni:ELEMENTS.${elementId}.NAME`, {
    defaultValue: humanizeElementId(elementId),
  });
}

function humanizeElementId(elementId: string): string {
  return elementId.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

/**
 * What a material is, which is also what decides how much of it there is.
 *
 * Read off the behaviours the game itself attached to the object, not off a
 * hand-kept list of prefab names - a save carries the behaviours, so this keeps
 * working when a DLC adds a seed nobody here has heard of.
 */
export type MaterialKind =
  "element" | "seed" | "egg" | "food" | "equipment" | "item";

/** The three units the game measures a resource in. */
export type MaterialMeasure = "mass" | "calories" | "count";

/**
 * Whether a game object group is material a colony sweeps, stores or eats.
 *
 * `Pickupable` alone is not the test. The largest pickupable group in a real
 * colony was 57 Chameleons, and duplicants are pickupable too - so anything
 * with a brain is excluded, which is what separates a critter from the meat it
 * eventually becomes.
 */
export function isMaterialGroup(behaviorNames: readonly string[]): boolean {
  if (!behaviorNames.includes("Pickupable")) {
    return false;
  }
  return !behaviorNames.some((name) => name.endsWith("Brain"));
}

/**
 * Classifies a material group by the behaviours on its objects.
 *
 * Eggs are the one kind with no behaviour of their own - a Chameleon Egg
 * carries nothing a research databank does not - so they are recognised by
 * name, which is also how the game names them (`EGG_NAME` in its catalogue).
 */
export function materialKind(
  groupName: string,
  behaviorNames: readonly string[],
): MaterialKind {
  if (behaviorNames.includes("PlantableSeed")) {
    return "seed";
  }
  if (behaviorNames.includes("Edible")) {
    return "food";
  }
  if (behaviorNames.includes("Equippable")) {
    return "equipment";
  }
  if (MaterialGameObjectNames.indexOf(groupName as MaterialObjectName) !== -1) {
    return "element";
  }
  if (groupName.endsWith("Egg")) {
    return "egg";
  }
  return "item";
}

/**
 * The unit a kind is measured in, mirroring the game's own three-way split:
 * `GameTags.MaterialCategories` are shown as mass, `CalorieCategories` as
 * kcal, and `UnitCategories` as a plain count.
 */
export function materialMeasure(kind: MaterialKind): MaterialMeasure {
  switch (kind) {
    case "element":
      return "mass";
    case "food":
      return "calories";
    default:
      return "count";
  }
}

const LOOSE_OBJECT_KEY_BY_PHASE: Record<ElementPhase, string> = {
  solid: "material_loose.clump_count",
  liquid: "material_loose.bottle_count",
  gas: "material_loose.canister_count",
  // No element in a vacuum phase ever lies on a floor, but the table has three.
  vacuum: "material_loose.clump_count",
};

/**
 * What a loose pile of this material is a pile *of*.
 *
 * Solid element lies around in clumps, liquid in bottles and gas in canisters
 * - Klei's own strings say "bottled liquids" and "Gas Canisters", and the
 * split is the one Sweep & Mop Orders makes. Calling all three clumps, which
 * the page used to, is wrong for every liquid in a colony.
 *
 * A counted material needs none of this: its amount already reads "31 seeds",
 * so the line under it only has to say the seeds are on the floor.
 */
export function looseObjectKey(kind: MaterialKind, groupName: string): string {
  if (kind !== "element") {
    return "material_loose.lying_around";
  }
  const phase = ELEMENT_PHASES[groupName];
  return LOOSE_OBJECT_KEY_BY_PHASE[phase] ?? "material_loose.clump_count";
}

/** The noun a counted material is counted in. */
export function countKey(kind: MaterialKind): string {
  switch (kind) {
    case "seed":
      return "material.seed_count";
    case "egg":
      return "material.egg_count";
    default:
      return "material.unit_count";
  }
}

/**
 * The calories in a quantity of food, or null if this is not a food the game
 * knows.
 *
 * `Edible.Calories` is `Units * foodInfo.CaloriesPerUnit`, and the food is
 * looked up by prefab name - `GetFormattedCaloriesForItem` passes `tag.Name`,
 * and a food prefab is created with its own food id as its name.
 */
export function foodCalories(groupName: string, units: number): number | null {
  const perUnit = FOOD_CALORIES_PER_UNIT[groupName];
  if (perUnit === undefined) {
    return null;
  }
  return units * perUnit;
}

/**
 * Formats calories the way the game does: kilocalories always, since
 * `AppendFormattedCalories` defaults `forceKcal` to true, rounded by
 * `AppendStandardFloat` - two decimals below ten, whole numbers above it.
 */
export function formatCalories(calories: number, t: CountTranslator): string {
  const kilocalories = calories / 1000;
  const rounded =
    Math.abs(kilocalories) < 10
      ? Number(kilocalories.toFixed(2))
      : Math.round(kilocalories);
  return t("material.kilocalorie", { count: rounded });
}

/**
 * The quantity a reader sees, in whatever unit this material is measured in.
 *
 * A save stores one number - `PrimaryElement.Units` - for all three, and it
 * means kilograms on an element, a count of things on an item, and a calorie
 * multiplier on food.
 */
export function formatQuantity(
  measure: MaterialMeasure,
  kind: MaterialKind,
  name: string,
  units: number,
  t: CountTranslator,
): string {
  if (measure === "mass") {
    return formatMass(units, t);
  }

  if (measure === "calories") {
    const calories = foodCalories(name, units);
    // A food the tuning table has never heard of - a mod's, or one added by a
    // game update this build predates. Counting the things is true; inventing
    // a calorie figure would not be.
    if (calories !== null) {
      return formatCalories(calories, t);
    }
  }

  return t(countKey(kind), { count: round(units) });
}

/**
 * What to call this kind of material under its name.
 *
 * Elements say which phase they are, because the table mixes all three and
 * "Salt Water" being a liquid is the reason its loose pile is measured in
 * bottles rather than clumps.
 */
export function kindKey(kind: MaterialKind, groupName: string): string {
  if (kind !== "element") {
    return `material.kind.${kind}`;
  }
  const phase = ELEMENT_PHASES[groupName] ?? "solid";
  return `material.kind.${phase === "vacuum" ? "solid" : phase}_element`;
}

/**
 * What the game calls this material.
 *
 * Elements resolve by rule, `ELEMENTS.<id>.NAME`. Nothing else does: a seed, an
 * egg or a piece of food is named from whatever catalogue key its config class
 * picked, so `tools/extract-item-names.py` pairs the two and the result lands
 * in the `ITEMS` group. Without it the page falls back to splitting the id,
 * which gives "Garden Forage Plant" for what the game calls **Snac Fruit** and
 * "Garden Food Plant Food" for **Sweatcorn** - not near misses, different
 * words.
 *
 * The split is still the fallback, for a prefab neither group covers: a mod's,
 * or one added by a game update this build predates.
 */
export function materialDisplayName(
  groupName: string,
  kind: MaterialKind,
  t: NameTranslator,
): string {
  const group = kind === "element" ? "ELEMENTS" : "ITEMS";
  return t(`oni:${group}.${groupName}.NAME`, {
    defaultValue: humanizeElementId(groupName),
  });
}

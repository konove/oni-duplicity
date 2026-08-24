import {
  GameObjectGroup,
  GameObject,
  GameObjectBehavior,
  getBehavior,
  StorageBehavior,
  PrimaryElementBehavior,
} from "oni-save-parser";
import { createSelector } from "reselect";
import { values, orderBy } from "lodash";

import {
  MaterialKind,
  MaterialMeasure,
  isMaterialGroup,
  materialKind,
  materialMeasure,
} from "../materials";

import { gameObjectGroupsSelector } from "./game-objects";

export interface MaterialListItem {
  /** The prefab name, which is the element id for an element chunk. */
  name: string;
  kind: MaterialKind;
  measure: MaterialMeasure;
  /**
   * How much is lying on the ground, in the unit `measure` names: kilograms
   * for an element, a count of things for everything else. Calories are
   * derived from this, not stored.
   */
  looseUnits: number;
  /** How many objects that is - clumps, bottles, canisters, or loose items. */
  looseObjects: number;
  storedUnits: number;
  /** How many containers hold some of it. */
  storedContainers: number;
}

export const materialsSelector = createSelector(
  gameObjectGroupsSelector,
  (groups) => collectMaterials(groups ?? []),
);

/**
 * Totals every material in a save, loose and stored.
 *
 * Two things a group can be, and it can be both: material in its own right,
 * and a container holding material. An atmo suit is swept like an item and
 * holds oxygen like a locker, so both passes run over every group rather than
 * one excluding the other.
 */
export function collectMaterials(
  groups: readonly GameObjectGroup[],
): MaterialListItem[] {
  const rowsByMaterial: Record<string, MaterialListItem> = {};

  for (const group of groups) {
    for (const gameObject of group.gameObjects) {
      const behaviorNames = gameObject.behaviors.map(
        (behavior: GameObjectBehavior) => behavior.name,
      );

      if (isMaterialGroup(behaviorNames)) {
        addLoose(group.name, behaviorNames, gameObject, rowsByMaterial);
      }

      addStored(gameObject, rowsByMaterial);
    }
  }

  return orderBy(values(rowsByMaterial), ["name"]);
}

function addLoose(
  name: string,
  behaviorNames: string[],
  gameObject: GameObject,
  rowsByMaterial: Record<string, MaterialListItem>,
) {
  const units = elementUnits(gameObject);
  if (units === null) {
    return;
  }

  const row = getRow(name, materialKind(name, behaviorNames), rowsByMaterial);
  row.looseUnits += units;
  row.looseObjects++;
}

/**
 * Adds whatever this object stores.
 *
 * Counted per container rather than per stack: a locker holding three stacks
 * of shale is one container, and saying "3 containers" for it - which the page
 * did - overstates how spread out a material is.
 */
function addStored(
  container: GameObject,
  rowsByMaterial: Record<string, MaterialListItem>,
) {
  const storage = getBehavior(container, StorageBehavior);
  if (!storage) {
    return;
  }

  const containedNames = new Set<string>();

  for (const { name, ...stored } of storage.extraData) {
    const behaviorNames = stored.behaviors.map(
      (behavior: GameObjectBehavior) => behavior.name,
    );
    if (!isMaterialGroup(behaviorNames)) {
      continue;
    }

    const units = elementUnits(stored);
    if (units === null) {
      continue;
    }

    const row = getRow(name, materialKind(name, behaviorNames), rowsByMaterial);
    row.storedUnits += units;
    containedNames.add(name);
  }

  for (const name of containedNames) {
    rowsByMaterial[name].storedContainers++;
  }
}

/** `PrimaryElement.Units`, or null for an object that has no element at all. */
function elementUnits(gameObject: GameObject): number | null {
  const element = getBehavior(gameObject, PrimaryElementBehavior);
  return element ? element.templateData.Units : null;
}

function getRow(
  name: string,
  kind: MaterialKind,
  rowsByMaterial: Record<string, MaterialListItem>,
): MaterialListItem {
  if (!rowsByMaterial[name]) {
    rowsByMaterial[name] = {
      name,
      kind,
      measure: materialMeasure(kind),
      looseUnits: 0,
      looseObjects: 0,
      storedUnits: 0,
      storedContainers: 0,
    };
  }
  return rowsByMaterial[name];
}

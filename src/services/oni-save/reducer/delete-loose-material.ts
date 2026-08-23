import { UnknownAction } from "redux";
import { SimHashNames, GameObjectGroup, SimHashName } from "oni-save-parser";

import { defaultOniSaveState, OniSaveState } from "../state";
import { isDeleteLooseMaterialAction } from "../actions/delete-loose-material";

import { tryModifySaveGame } from "./utils";

export default function deleteLooseMaterialReducer(
  state: OniSaveState = defaultOniSaveState,
  action: UnknownAction,
): OniSaveState {
  if (!isDeleteLooseMaterialAction(action)) {
    return state;
  }

  const { materialType } = action.payload;
  const materialsToRemove: readonly SimHashName[] = materialType
    ? [materialType]
    : SimHashNames;

  // Loose material sits in top-level groups named after the element. Anything
  // stored is nested inside a Storage behavior's extraData and is not touched
  // by this.
  return tryModifySaveGame(state, (saveGame) => ({
    ...saveGame,
    gameObjects: saveGame.gameObjects.filter(
      (group) => !shouldRemove(group, materialsToRemove),
    ),
  }));
}

function shouldRemove(
  group: GameObjectGroup,
  materialsToRemove: readonly SimHashName[],
): boolean {
  return materialsToRemove.includes(group.name as SimHashName);
}

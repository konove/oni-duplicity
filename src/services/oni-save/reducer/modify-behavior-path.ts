import { UnknownAction } from "redux";
import { SaveGame } from "@konove/oni-save-parser";

import { OniSaveState, defaultOniSaveState } from "../state";
import { isModifyBehaviorPathAction } from "../actions/modify-behavior-path";

import {
  tryModifySaveGame,
  requireGameObject,
  changeStateBehaviorData,
  set,
  replaceGameObject,
} from "./utils";

export default function modifyBehaviorPathReducer(
  state: OniSaveState = defaultOniSaveState,
  action: UnknownAction,
): OniSaveState {
  if (!isModifyBehaviorPathAction(action)) {
    return state;
  }

  const { gameObjectId, behaviorName, behaviorPath, value } = action.payload;

  return tryModifySaveGame(state, (saveGame) =>
    performModifyBehaviorPath(
      saveGame,
      gameObjectId,
      behaviorName,
      behaviorPath,
      value,
    ),
  );
}

function performModifyBehaviorPath(
  saveGame: SaveGame,
  gameObjectId: number,
  behaviorName: string,
  behaviorPath: readonly string[],
  value: any,
): SaveGame {
  let gameObject = requireGameObject(saveGame, gameObjectId);

  gameObject = changeStateBehaviorData(
    gameObject,
    behaviorName,
    behaviorPath[0] as any,
    (data) => set(data, behaviorPath.slice(1), value),
  );

  saveGame = replaceGameObject(saveGame, gameObject);

  return saveGame;
}

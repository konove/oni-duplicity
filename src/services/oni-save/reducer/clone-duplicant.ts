import { UnknownAction } from "redux";
import {
  KPrefabIDBehavior,
  GameObject,
  MinionIdentityBehavior,
  GameObjectBehavior,
  SaveGame,
  getBehavior,
} from "@konove/oni-save-parser";

import { defaultOniSaveState, OniSaveState } from "../state";
import { isCloneDuplicantAction } from "../actions/clone-duplicant";
import { isDuplicantType } from "../duplicants";

import {
  changeStateBehaviorData,
  requireGameObject,
  requireBehavior,
  addGameObject,
  tryModifySaveGame,
} from "./utils";

export default function cloneDuplicantReducer(
  state: OniSaveState = defaultOniSaveState,
  action: UnknownAction,
): OniSaveState {
  if (!isCloneDuplicantAction(action)) {
    return state;
  }

  const { gameObjectId } = action.payload;

  return tryModifySaveGame(state, (saveGame) =>
    performCloneDuplicant(saveGame, gameObjectId),
  );
}

const BEHAVIOR_BLACKLIST = ["StateMachineController", "Navigator"];
function shouldCloneBehavior(behavior: GameObjectBehavior): boolean {
  return BEHAVIOR_BLACKLIST.indexOf(behavior.name) === -1;
}

function performCloneDuplicant(
  saveGame: SaveGame,
  gameObjectId: number,
): SaveGame {
  // Clone back into whichever duplicant group the original came from, so a
  // bionic duplicant does not end up among the standard Minions.
  const group = saveGame.gameObjects.find((g) =>
    g.gameObjects.some(
      (o) =>
        getBehavior(o, KPrefabIDBehavior)?.templateData.InstanceID ===
        gameObjectId,
    ),
  );
  const gameObjectType =
    group && isDuplicantType(group.name) ? group.name : "Minion";

  const gameObject = requireGameObject(saveGame, gameObjectId, gameObjectType);

  // Look up the old duplicant's name
  const oldIdentity = requireBehavior(gameObject, MinionIdentityBehavior);

  let newMinion: GameObject | null = {
    ...gameObject,
    behaviors: gameObject.behaviors.filter(shouldCloneBehavior),
  };

  const newPrefabId = saveGame.settings.nextUniqueID;

  newMinion = changeStateBehaviorData(
    newMinion,
    KPrefabIDBehavior,
    "templateData",
    {
      InstanceID: newPrefabId,
    },
  );

  newMinion = changeStateBehaviorData(
    newMinion,
    MinionIdentityBehavior,
    "templateData",
    {
      assignableProxy: {
        id: -1,
      },
    },
  );

  // Increment the next unique id; we used the current one.
  saveGame = {
    ...saveGame,
    settings: {
      ...saveGame.settings,
      nextUniqueID: newPrefabId + 1,
    },
  };

  // Give the new duplicate a new name to differentiate it.
  newMinion = changeStateBehaviorData(
    newMinion,
    MinionIdentityBehavior,
    "templateData",
    {
      name: `Clone of ${oldIdentity.templateData.name}`,
    },
  );

  saveGame = addGameObject(saveGame, gameObjectType, newMinion);

  return saveGame;
}

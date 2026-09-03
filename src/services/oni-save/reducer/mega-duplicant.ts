import { UnknownAction } from "redux";
import {
  AIAttributeLevelsBehavior,
  AITraitsBehavior,
  MinionResumeBehavior,
  SaveGame,
  getHashedString,
} from "@konove/oni-save-parser";

import { defaultOniSaveState, OniSaveState } from "../state";
import { isMegaDuplicantAction } from "../actions/mega-duplicant";
import {
  MEGA_ATTRIBUTE_LEVEL,
  MEGA_EXPERIENCE,
  megaAptitudeIds,
  megaTraitIds,
} from "../mega-duplicant";
import { isDuplicantType } from "../duplicants";
import { getGameObjectId } from "../utils";

import {
  changeStateBehaviorData,
  replaceGameObject,
  requireGameObject,
  tryModifySaveGame,
} from "./utils";

export default function megaDuplicantReducer(
  state: OniSaveState = defaultOniSaveState,
  action: UnknownAction,
): OniSaveState {
  if (!isMegaDuplicantAction(action)) {
    return state;
  }

  const { gameObjectId } = action.payload;

  return tryModifySaveGame(state, (saveGame) =>
    performMegaDuplicant(saveGame, gameObjectId),
  );
}

function performMegaDuplicant(
  saveGame: SaveGame,
  gameObjectId: number,
): SaveGame {
  // Accept whichever duplicant group the object sits in, so this works on a
  // bionic duplicant as well as a standard one.
  const group = saveGame.gameObjects.find(
    (g) =>
      isDuplicantType(g.name) &&
      g.gameObjects.some((o) => getGameObjectId(o) === gameObjectId),
  );

  let gameObject = requireGameObject(
    saveGame,
    gameObjectId,
    group ? group.name : "Minion",
  );

  const dlcIds = saveGame.header.gameInfo.dlcIds
    ? saveGame.header.gameInfo.dlcIds
    : saveGame.header.gameInfo.dlcId
      ? [saveGame.header.gameInfo.dlcId]
      : [];

  // Only the levels the duplicant already carries are raised. The set of
  // attributes a duplicant has is decided by the game, and inventing entries
  // here would add ones it does not know about.
  gameObject = changeStateBehaviorData(
    gameObject,
    AIAttributeLevelsBehavior,
    "templateData",
    (templateData) => ({
      ...templateData,
      saveLoadLevels: templateData.saveLoadLevels.map((level) => ({
        ...level,
        level: MEGA_ATTRIBUTE_LEVEL,
      })),
    }),
  );

  gameObject = changeStateBehaviorData(
    gameObject,
    AITraitsBehavior,
    "templateData",
    (templateData) => ({
      ...templateData,
      TraitIds: megaTraitIds(dlcIds),
    }),
  );

  gameObject = changeStateBehaviorData(
    gameObject,
    MinionResumeBehavior,
    "templateData",
    (templateData) => ({
      ...templateData,
      totalExperienceGained: MEGA_EXPERIENCE,
      AptitudeBySkillGroup: megaAptitudeIds().map(
        (id) =>
          [getHashedString(id), 1] as [
            ReturnType<typeof getHashedString>,
            number,
          ],
      ),
    }),
  );

  return replaceGameObject(saveGame, gameObject);
}

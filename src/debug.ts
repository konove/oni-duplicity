import { isProd } from "@/runtime-env";

import store from "@/store/store";

import {
  receiveOniSaveSuccess,
  receiveOniSaveError,
} from "@/services/oni-save/actions/receive-onisave";
import { LoadingStatus } from "@/services/oni-save/state";
import {
  modifyBehavior,
  BehaviorDataTarget,
} from "@/services/oni-save/actions/modify-behavior";
import { gameObjectTypesByIdSelector } from "@/services/oni-save/selectors/game-objects";
import {
  FactionAlignmentBehavior,
  isDuplicantType,
} from "@/services/oni-save/duplicants";

if (!isProd) {
  window.loadMockSave = () => {
    const mockSaveGame = require("@/__mocks__/save-game.json");
    store.dispatch(receiveOniSaveSuccess(mockSaveGame, LoadingStatus.Loading));
  };
  // No save on hand contains a dead duplicant, and there is no way to kill one
  // through the editor - so without this the dead state cannot be looked at,
  // by a person or by a screenshot test. Flips the first duplicant's faction
  // alignment, which is what dying actually does to the save (ROADMAP 1.1).
  window.killMockDuplicant = () => {
    const typesById = gameObjectTypesByIdSelector(store.getState());
    const id = Object.keys(typesById)
      .map(Number)
      .find((gameObjectId) => isDuplicantType(typesById[gameObjectId]));
    if (id == null) {
      throw new Error("No duplicant to kill - is a save loaded?");
    }
    store.dispatch(
      modifyBehavior(
        id,
        FactionAlignmentBehavior,
        BehaviorDataTarget.Template,
        {
          alignmentActive: false,
          targetable: false,
        },
      ),
    );
    return id;
  };
  window.loadMockError = () => {
    store.dispatch(
      receiveOniSaveError(
        new Error("This is a test error"),
        LoadingStatus.Loading,
      ),
    );
  };
}

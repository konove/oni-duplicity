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
  StateMachineControllerBehavior,
  isDuplicantType,
} from "@/services/oni-save/duplicants";
import {
  DEATH_MONITOR,
  DEATH_PARAMETER,
  encodeParameters,
  encodeResourceValue,
  encodeStateMachines,
} from "@/services/oni-save/state-machines";

if (!isProd) {
  window.loadMockSave = () => {
    const mockSaveGame = require("@/__mocks__/save-game.json");
    store.dispatch(receiveOniSaveSuccess(mockSaveGame, LoadingStatus.Loading));
  };
  // No save on hand contains a dead duplicant, and there is no way to kill one
  // through the editor - so without this the dead state cannot be looked at,
  // by a person or by a screenshot test.
  //
  // Builds the state machine blob a real death leaves behind, so everything
  // downstream goes through the same decode and revive path a real save does.
  // The bundled example is JSON and an ArrayBuffer does not survive that, so
  // its duplicants start with no blob at all.
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
        StateMachineControllerBehavior,
        BehaviorDataTarget.Raw,
        encodeStateMachines({
          version: 20,
          entries: [
            {
              leading: 0,
              type: DEATH_MONITOR,
              suffix: null,
              currentState: "root.dead.ground",
              data: encodeParameters([
                {
                  contextType: "StateMachine`4+ResourceParameter`1+Context",
                  name: DEATH_PARAMETER,
                  value: encodeResourceValue("Root.Deaths.Suffocation"),
                },
              ]),
            },
          ],
        }),
      ),
    );
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

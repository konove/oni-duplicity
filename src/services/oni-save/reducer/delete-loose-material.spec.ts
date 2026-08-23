import { SaveGame, SimHashNames } from "oni-save-parser";

import { OniSaveState, defaultOniSaveState, LoadingStatus } from "../state";
import { deleteLooseMaterial } from "../actions/delete-loose-material";

import deleteLooseMaterialReducer from "./delete-loose-material";

describe("deleteLooseMaterialReducer", () => {
  describe("no-op cases", () => {
    it("makes no changes when the save game is not present", () => {
      const state = defaultOniSaveState;
      const action = deleteLooseMaterial();

      const resultState = deleteLooseMaterialReducer(state, action);

      expect(resultState).toBe(state);
    });

    it("makes no changes when the action is not the correct type", () => {
      const state = makeState(["Oxygen"]);
      const action = { ...deleteLooseMaterial(), type: "another-action" };

      const resultState = deleteLooseMaterialReducer(state, action);

      expect(resultState).toBe(state);
    });
  });

  describe("operational cases", () => {
    it("removes only the named material", () => {
      const state = makeState(["Oxygen", "SandStone", "Minion"]);

      const resultState = deleteLooseMaterialReducer(
        state,
        deleteLooseMaterial("Oxygen"),
      );

      expect(groupNames(resultState)).toEqual(["SandStone", "Minion"]);
    });

    // The bug this reducer shipped with: the filter predicate returned
    // `indexOf`, so only the material at index 0 of SimHashNames - Aerogel -
    // was ever removed, and everything after it read as truthy and was kept.
    it("removes every material when no type is named", () => {
      const state = makeState([
        SimHashNames[0],
        SimHashNames[1],
        SimHashNames[2],
        "Minion",
      ]);

      const resultState = deleteLooseMaterialReducer(
        state,
        deleteLooseMaterial(),
      );

      expect(groupNames(resultState)).toEqual(["Minion"]);
    });

    it("leaves game objects that are not materials alone", () => {
      const state = makeState(["Minion", "BionicMinion", "Asteroid"]);

      const resultState = deleteLooseMaterialReducer(
        state,
        deleteLooseMaterial(),
      );

      expect(groupNames(resultState)).toEqual([
        "Minion",
        "BionicMinion",
        "Asteroid",
      ]);
    });

    // Without this the Modified chip stays off and the user has no signal that
    // the save differs from the file they loaded.
    it("marks the save as modified", () => {
      const state = makeState(["Oxygen"]);

      const resultState = deleteLooseMaterialReducer(
        state,
        deleteLooseMaterial("Oxygen"),
      );

      expect(resultState.isModified).toBe(true);
    });

    it("does not mutate the state it was given", () => {
      const state = makeState(["Oxygen", "Minion"]);

      deleteLooseMaterialReducer(state, deleteLooseMaterial());

      expect(groupNames(state)).toEqual(["Oxygen", "Minion"]);
      expect(state.isModified).toBe(false);
    });
  });
});

function makeState(groupNames: string[]): OniSaveState {
  const saveGame: DeepPartial<SaveGame> = {
    gameObjects: groupNames.map((name) => ({ name, gameObjects: [] })),
  };
  return {
    ...defaultOniSaveState,
    loadingStatus: LoadingStatus.Ready,
    saveGame: saveGame as SaveGame,
  };
}

function groupNames(state: OniSaveState): string[] {
  return (state.saveGame?.gameObjects ?? []).map((group) => group.name);
}

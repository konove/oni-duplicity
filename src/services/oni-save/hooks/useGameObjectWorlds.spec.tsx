/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { SaveGame } from "@konove/oni-save-parser";

import mockSave from "@/__mocks__/save-game.json";
import { AppState } from "@/state";

import { defaultOniSaveState } from "../state";

import useGameObjectWorlds from "./useGameObjectWorlds";

// The real selectors over the real mock save, with react-redux's store
// replaced by a state object. The mock save is a two-asteroid cluster with
// one geyser, id 900000, at (111.5, 125) - inside the first world's rect.
let state: AppState;
jest.mock("react-redux", () => ({
  useSelector: (selector: (state: AppState) => unknown) => selector(state),
}));

const CHLORINE_VENT = 900000;
const withSave = (saveGame: SaveGame | null): AppState =>
  ({ services: { oniSave: { ...defaultOniSaveState, saveGame } } }) as AppState;

describe("useGameObjectWorlds", () => {
  it("places each object on the world whose rect holds it", () => {
    state = withSave(mockSave as unknown as SaveGame);
    const { result } = renderHook(() => useGameObjectWorlds([CHLORINE_VENT]));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].world?.id).toBe(0);
    expect(result.current[0].gameObjectIds).toEqual([CHLORINE_VENT]);
  });

  // A base game save has no worlds: everything is one unplaced group, which
  // is what lets a list page show a plain list without asking about DLC.
  it("groups everything under no world when the save has none", () => {
    state = withSave(null);
    const { result } = renderHook(() => useGameObjectWorlds([1, 2]));

    expect(result.current).toEqual([{ world: null, gameObjectIds: [1, 2] }]);
  });

  it("returns the same groups for the same ids", () => {
    state = withSave(mockSave as unknown as SaveGame);
    const ids = [CHLORINE_VENT];
    const { result, rerender } = renderHook(() => useGameObjectWorlds(ids));
    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });
});

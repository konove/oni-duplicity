import { SaveGame } from "@konove/oni-save-parser";

import mockSave from "@/__mocks__/save-game.json";

import { OniSaveState, defaultOniSaveState } from "../state";

import { worldsSelector } from "./worlds";

const loaded: OniSaveState = {
  ...defaultOniSaveState,
  saveGame: mockSave as unknown as SaveGame,
};

describe("worldsSelector", () => {
  it("is empty with no save", () => {
    expect(worldsSelector.local(defaultOniSaveState)).toEqual([]);
  });

  // The mock save is a two-asteroid cluster. Each world is one game object in
  // the Asteroid group, and its own `id` is what positions resolve to.
  it("lists every world with the game object that carries it", () => {
    const worlds = worldsSelector.local(loaded);
    expect(
      worlds.map(({ id, gameObjectId }) => ({ id, gameObjectId })),
    ).toEqual([
      { id: 0, gameObjectId: 3460660 },
      { id: 1, gameObjectId: 3460662 },
    ]);
    expect(worlds[0].templateData.worldSize).toEqual({ x: 160, y: 274 });
  });

  it("returns the same array while the save is unchanged", () => {
    expect(worldsSelector.local(loaded)).toBe(worldsSelector.local(loaded));
  });
});

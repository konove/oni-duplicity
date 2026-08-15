import { SaveGame } from "oni-save-parser";

import { OniSaveState, defaultOniSaveState } from "../state";

import { dlcIdsSelector, hasDLCs, isBaseGameOnly } from "./dlc";

function stateWithGameInfo(gameInfo: any): OniSaveState {
  return {
    ...defaultOniSaveState,
    saveGame: { header: { gameInfo } } as SaveGame,
  };
}

describe("dlcIdsSelector", () => {
  it("returns nothing when no save is loaded", () => {
    expect(dlcIdsSelector.local(defaultOniSaveState)).toEqual([]);
  });

  // Saves before 7.28 have no DLC field at all.
  it("returns nothing for a pre-DLC save", () => {
    const state = stateWithGameInfo({ baseName: "Ultra Crater" });
    expect(dlcIdsSelector.local(state)).toEqual([]);
  });

  // 7.28 - 7.32 wrote a single string.
  it("wraps the legacy single dlcId", () => {
    const state = stateWithGameInfo({ dlcId: "EXPANSION1_ID" });
    expect(dlcIdsSelector.local(state)).toEqual(["EXPANSION1_ID"]);
  });

  // 7.34+ writes the array and leaves dlcId as an explicit null.
  it("prefers dlcIds over a null dlcId", () => {
    const state = stateWithGameInfo({
      dlcId: null,
      dlcIds: ["EXPANSION1_ID", "DLC4_ID", "DLC2_ID", "DLC3_ID"],
    });
    expect(dlcIdsSelector.local(state)).toEqual([
      "EXPANSION1_ID",
      "DLC4_ID",
      "DLC2_ID",
      "DLC3_ID",
    ]);
  });

  it("treats an empty dlcIds array as base game", () => {
    const state = stateWithGameInfo({ dlcId: null, dlcIds: [] });
    expect(dlcIdsSelector.local(state)).toEqual([]);
  });
});

describe("isBaseGameOnly", () => {
  it("accepts an absent, empty, or vanilla marker", () => {
    expect(isBaseGameOnly([])).toBe(true);
    expect(isBaseGameOnly([""])).toBe(true);
    expect(isBaseGameOnly(["VANILLA_ID"])).toBe(true);
  });

  it("rejects any real content pack", () => {
    expect(isBaseGameOnly(["EXPANSION1_ID"])).toBe(false);
    expect(isBaseGameOnly(["VANILLA_ID", "DLC2_ID"])).toBe(false);
  });
});

describe("hasDLCs", () => {
  const dlcIds = ["EXPANSION1_ID", "DLC2_ID", "DLC3_ID"];

  it("tests membership, not order or position", () => {
    expect(hasDLCs(dlcIds, "DLC3_ID")).toBe(true);
    expect(hasDLCs(dlcIds, "DLC4_ID")).toBe(false);
  });

  it("requires every entry when given several", () => {
    expect(hasDLCs(dlcIds, ["EXPANSION1_ID", "DLC2_ID"])).toBe(true);
    expect(hasDLCs(dlcIds, ["EXPANSION1_ID", "DLC4_ID"])).toBe(false);
  });

  it("reads DLCIds.None as 'base game only'", () => {
    expect(hasDLCs([], "")).toBe(true);
    expect(hasDLCs(["VANILLA_ID"], "")).toBe(true);
    expect(hasDLCs(dlcIds, "")).toBe(false);
  });
});

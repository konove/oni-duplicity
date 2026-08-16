import { TFunction } from "i18next";
import { AI_EFFECT_IDS } from "oni-save-parser";

import { effectName, effectNameKey, sortEffectsByName } from "./effects";

// Real ids and labels. None of these sort the same by id as by label.
const NAMES: Record<string, string> = {
  RoomMessHall: "Mess Hall",
  SoreBack: "Sore Back",
  Decor5: "Last Cycle's Decor: Gorgeous",
  AnewHope: "A New Hope",
};

const t = ((key: string, opts?: { defaultValue?: string }) => {
  const match = /^oni:DUPLICANTS\.EFFECTS\.(.+)\.NAME$/.exec(key);
  if (match && NAMES[match[1]]) {
    return NAMES[match[1]];
  }
  return opts?.defaultValue ?? key;
}) as unknown as TFunction;

describe("effectNameKey", () => {
  it("keys by the exact id", () => {
    expect(effectNameKey("SoreBack")).toBe(
      "oni:DUPLICANTS.EFFECTS.SoreBack.NAME",
    );
  });
});

describe("effectName", () => {
  it("resolves a known effect", () => {
    expect(effectName("RoomMessHall", t)).toBe("Mess Hall");
  });

  // Ten ids have no player-facing string, so this path is used in practice.
  it("falls back to the id when the game names it nowhere", () => {
    expect(effectName("Hyperthermia", t)).toBe("Hyperthermia");
  });
});

describe("sortEffectsByName", () => {
  it("orders by label, not by id", () => {
    const sorted = sortEffectsByName(Object.keys(NAMES), t);
    expect(sorted.map((id) => NAMES[id])).toEqual([
      "A New Hope",
      "Last Cycle's Decor: Gorgeous",
      "Mess Hall",
      "Sore Back",
    ]);
  });

  it("does not mutate its input", () => {
    const ids = ["SoreBack", "AnewHope"];
    sortEffectsByName(ids, t);
    expect(ids).toEqual(["SoreBack", "AnewHope"]);
  });
});

describe("AI_EFFECT_IDS", () => {
  it("covers the effects real duplicants carry", () => {
    // A sample observed on duplicants across this machine's save library,
    // including runtime-built families that appear in no code literal.
    for (const id of [
      "Decor0",
      "Decor5",
      "DecorMinus1",
      "Edible3",
      "EdibleMinus3",
      "RoomMessHall",
      "RoomBarracks",
      "SoakingWet",
      "WorkEncouraged",
    ]) {
      expect(AI_EFFECT_IDS).toContain(id);
    }
  });

  it("leaves out critter effects, which mean nothing on a duplicant", () => {
    expect(AI_EFFECT_IDS).not.toContain("GlassDeerWellFed");
    expect(AI_EFFECT_IDS).not.toContain("RaptorWellFed");
  });

  it("has no duplicates", () => {
    expect(new Set(AI_EFFECT_IDS).size).toBe(AI_EFFECT_IDS.length);
  });
});

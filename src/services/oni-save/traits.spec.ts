import { TFunction } from "i18next";

import {
  sortTraitIdsByName,
  sortTraitsByName,
  traitDescKey,
  traitName,
  traitNameKey,
} from "./traits";

// Real ids and labels from the game: every one of these sorts differently by
// label than by id, which is the whole reason this helper exists.
const NAMES: Record<string, string> = {
  Aggressive: "Destructive",
  ConstructionUp: "Handy",
  Allergies: "Allergies",
  ArtDown: "Unpracticed Artist",
  BalloonArtist: "Balloon Artist",
};

// Stand-in for i18next's `t`: resolves the NAME keys above, and honours
// `defaultValue` for anything unknown, the way the real one does.
const t = ((key: string, opts?: { defaultValue?: string }) => {
  const match = /^oni:DUPLICANTS\.TRAITS\.(.+)\.NAME$/.exec(key);
  if (match) {
    const id = Object.keys(NAMES).find((x) => x.toUpperCase() === match[1]);
    if (id) return NAMES[id];
  }
  return opts?.defaultValue ?? key;
}) as unknown as TFunction;

describe("traitNameKey / traitDescKey", () => {
  it("builds the uppercased lookup keys", () => {
    expect(traitNameKey("FrostProof")).toBe(
      "oni:DUPLICANTS.TRAITS.FROSTPROOF.NAME",
    );
    expect(traitDescKey("FrostProof")).toBe(
      "oni:DUPLICANTS.TRAITS.FROSTPROOF.DESC",
    );
  });
});

describe("traitName", () => {
  it("resolves a known trait to its label", () => {
    expect(traitName("Aggressive", t)).toBe("Destructive");
  });

  it("falls back to the raw id for a trait with no translation", () => {
    expect(traitName("SomeModdedTrait", t)).toBe("SomeModdedTrait");
  });
});

describe("sortTraitIdsByName", () => {
  it("orders by label, not by id", () => {
    const sorted = sortTraitIdsByName(Object.keys(NAMES), t);
    expect(sorted.map((id) => NAMES[id])).toEqual([
      "Allergies",
      "Balloon Artist",
      "Destructive",
      "Handy",
      "Unpracticed Artist",
    ]);
  });

  it("would order differently if it sorted by id", () => {
    // Guards the actual defect: `Aggressive` sorts first by id but its label
    // "Destructive" belongs in the middle.
    const byId = [...Object.keys(NAMES)].sort();
    expect(sortTraitIdsByName(Object.keys(NAMES), t)).not.toEqual(byId);
    expect(byId[0]).toBe("Aggressive");
  });

  it("does not mutate its input", () => {
    const ids = ["ConstructionUp", "Allergies"];
    sortTraitIdsByName(ids, t);
    expect(ids).toEqual(["ConstructionUp", "Allergies"]);
  });

  it("sorts untranslated ids alongside translated ones", () => {
    const sorted = sortTraitIdsByName(["ZzUnknown", "Aggressive"], t);
    expect(sorted).toEqual(["Aggressive", "ZzUnknown"]);
  });
});

describe("sortTraitsByName", () => {
  it("keeps each item's original index so removal targets the right entry", () => {
    const traitIds = ["ConstructionUp", "Aggressive", "Allergies"];
    const ordered = sortTraitsByName(
      traitIds.map((trait, index) => ({ trait, index })),
      ({ trait }) => trait,
      t,
    );

    expect(ordered.map((x) => x.trait)).toEqual([
      "Allergies",
      "Aggressive",
      "ConstructionUp",
    ]);
    // Displayed second, but still index 1 in the save.
    expect(ordered[1]).toEqual({ trait: "Aggressive", index: 1 });
    for (const item of ordered) {
      expect(traitIds[item.index]).toBe(item.trait);
    }
  });
});

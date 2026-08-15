import { AI_TRAITS, MinionSkillGroupNames } from "oni-save-parser";

import { megaAptitudeIds, megaTraitIds } from "./mega-duplicant";

const ALL_PACKS = ["EXPANSION1_ID", "DLC2_ID", "DLC3_ID", "DLC4_ID", "DLC5_ID"];

describe("megaTraitIds", () => {
  it("only picks traits the game calls positive", () => {
    const positive = new Set(
      AI_TRAITS.filter((t) => t.positive).map((t) => t.id),
    );
    for (const id of megaTraitIds(ALL_PACKS)) {
      expect(positive.has(id)).toBe(true);
    }
  });

  it("picks a useful number of them", () => {
    expect(megaTraitIds(ALL_PACKS).length).toBeGreaterThan(20);
  });

  // The whole reason this is not just a filter: three positive pairs cannot
  // be held together, and a duplicant holding both would be invalid.
  it("never picks both halves of a mutually exclusive pair", () => {
    const chosen = megaTraitIds(ALL_PACKS);
    for (const id of chosen) {
      const trait = AI_TRAITS.find((t) => t.id === id);
      for (const other of trait?.mutuallyExclusive || []) {
        expect(chosen).not.toContain(other);
      }
    }
  });

  it("resolves the known positive conflicts to exactly one each", () => {
    const chosen = megaTraitIds(ALL_PACKS);
    const pairs: [string, string][] = [
      ["EarlyBird", "NightOwl"],
      ["SimpleTastes", "Foodie"],
      ["Uncultured", "InteriorDecorator"],
    ];
    for (const [a, b] of pairs) {
      expect(Number(chosen.includes(a)) + Number(chosen.includes(b))).toBe(1);
    }
  });

  it("leaves out traits whose content pack is not active", () => {
    const gated = AI_TRAITS.filter(
      (t) => t.positive && (t.requiredDlcIds || []).length > 0,
    );
    const baseGame = megaTraitIds([]);
    for (const trait of gated) {
      expect(baseGame).not.toContain(trait.id);
    }
  });

  it("gives a base game save fewer traits than a fully packed one", () => {
    expect(megaTraitIds([]).length).toBeLessThanOrEqual(
      megaTraitIds(ALL_PACKS).length,
    );
  });
});

describe("megaAptitudeIds", () => {
  it("returns every interest", () => {
    expect(megaAptitudeIds()).toEqual([...MinionSkillGroupNames]);
  });

  it("includes the Spaced Out! rocketry interest", () => {
    expect(megaAptitudeIds()).toContain("Rocketry");
  });
});

import { availableSkills } from "./skills";

const BASE_GAME: string[] = [];
const ALL_PACKS = ["EXPANSION1_ID", "DLC2_ID", "DLC3_ID", "DLC4_ID", "DLC5_ID"];

const ids = (dlcIds: string[], model?: string | null) =>
  availableSkills(dlcIds, model).map((s) => s.id);

describe("availableSkills", () => {
  it("offers the base game skills without any pack", () => {
    const skills = ids(BASE_GAME);
    expect(skills).toContain("Mining1");
    expect(skills).toContain("Medicine3");
  });

  // The Aquatic Planet Pack skills, which prompted this.
  it("withholds the swimming skills until Aquatic is active", () => {
    expect(ids(BASE_GAME)).not.toContain("Swimming");
    expect(ids(["DLC5_ID"])).toContain("Swimming");
    expect(ids(["DLC5_ID"])).toContain("Swimming2");
  });

  it("withholds Spaced Out! skills until it is active", () => {
    expect(ids(BASE_GAME)).not.toContain("RocketPiloting1");
    expect(ids(["EXPANSION1_ID"])).toContain("RocketPiloting1");
  });

  it("does not offer another pack's skills when only one is active", () => {
    expect(ids(["DLC5_ID"])).not.toContain("RocketPiloting1");
  });

  // Bionic skills need the pack *and* a bionic duplicant.
  it("offers bionic skills only to a bionic duplicant", () => {
    expect(ids(ALL_PACKS, "Minion")).not.toContain("BionicsA1");
    expect(ids(ALL_PACKS, "BionicMinion")).toContain("BionicsA1");
  });

  it("does not offer bionic skills without the pack", () => {
    expect(ids(BASE_GAME, "BionicMinion")).not.toContain("BionicsA1");
  });

  it("gives a bionic duplicant only its own skills", () => {
    const bionic = ids(ALL_PACKS, "BionicMinion");
    expect(bionic).not.toContain("Mining1");
    expect(bionic.every((id) => id.startsWith("Bionics"))).toBe(true);
  });

  // Saves before 7.36 have no model, and predate every model-restricted skill.
  it("treats a missing model as the standard duplicant", () => {
    expect(ids(ALL_PACKS)).toEqual(ids(ALL_PACKS, "Minion"));
    expect(ids(ALL_PACKS, null)).toEqual(ids(ALL_PACKS, "Minion"));
  });
});

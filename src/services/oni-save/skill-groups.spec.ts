import { TFunction } from "i18next";

import {
  skillGroupDescKey,
  skillGroupName,
  skillGroupNameKey,
  sortSkillGroupsByName,
} from "./skill-groups";

// Real ids and labels. Note how little the two have to do with each other -
// that mismatch is why sorting has to happen on the label.
const NAMES: Record<string, string> = {
  MedicalAid: "Doctor",
  Mining: "Digger",
  Rocketry: "Pilot",
  Art: "Decorator",
  Basekeeping: "Tidier",
};

const t = ((key: string, opts?: { defaultValue?: string }) => {
  const match = /^oni:DUPLICANTS\.SKILLGROUPS\.(.+)\.NAME$/.exec(key);
  if (match && NAMES[match[1]]) {
    return NAMES[match[1]];
  }
  return opts?.defaultValue ?? key;
}) as unknown as TFunction;

describe("skillGroupNameKey / skillGroupDescKey", () => {
  it("keys by the exact id, not an uppercased one", () => {
    expect(skillGroupNameKey("MedicalAid")).toBe(
      "oni:DUPLICANTS.SKILLGROUPS.MedicalAid.NAME",
    );
    expect(skillGroupDescKey("Rocketry")).toBe(
      "oni:DUPLICANTS.SKILLGROUPS.Rocketry.DESC",
    );
  });
});

describe("skillGroupName", () => {
  it("resolves a known group to its label", () => {
    expect(skillGroupName("Rocketry", t)).toBe("Pilot");
  });

  // The game dropped Management from its string table but saves still carry it.
  it("falls back to the id for a group with no translation", () => {
    expect(skillGroupName("Management", t)).toBe("Management");
  });
});

describe("sortSkillGroupsByName", () => {
  it("orders by label, not by id", () => {
    const sorted = sortSkillGroupsByName(Object.keys(NAMES), t);
    expect(sorted.map((id) => NAMES[id])).toEqual([
      "Decorator",
      "Digger",
      "Doctor",
      "Pilot",
      "Tidier",
    ]);
  });

  it("would order differently if it sorted by id", () => {
    expect(sortSkillGroupsByName(Object.keys(NAMES), t)).not.toEqual(
      [...Object.keys(NAMES)].sort(),
    );
  });

  it("places an untranslated group by its id", () => {
    // "Management" sorts between "Doctor" and "Pilot".
    const sorted = sortSkillGroupsByName(
      ["Rocketry", "Management", "MedicalAid"],
      t,
    );
    expect(sorted).toEqual(["MedicalAid", "Management", "Rocketry"]);
  });

  it("does not mutate its input", () => {
    const ids = ["Rocketry", "Art"];
    sortSkillGroupsByName(ids, t);
    expect(ids).toEqual(["Rocketry", "Art"]);
  });
});

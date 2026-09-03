import { TFunction } from "i18next";
import { MinionSkill, MinionSkills } from "@konove/oni-save-parser";

/** Skill display strings are keyed by the exact skill id. */
export function skillNameKey(skillId: string): string {
  return `oni:DUPLICANTS.SKILLS.${skillId}.NAME`;
}

/** The translated name, falling back to the raw id for unknown skills. */
export function skillName(skillId: string, t: TFunction): string {
  return t(skillNameKey(skillId), { defaultValue: skillId });
}

/**
 * The skills a given duplicant can actually hold.
 *
 * Two things narrow the list. A skill from a content pack does not exist in a
 * save without that pack, and the Bionic Booster Pack's skills apply only to
 * bionic duplicants. Granting mastery outside those bounds writes something
 * the game will not honour, so both are filtered here rather than left to the
 * user to know.
 *
 * `model` comes from `MinionIdentity.model.name` - "Minion" for a standard
 * duplicant, "BionicMinion" for a bionic one. Saves before 7.36 have no model
 * at all; those predate every model-restricted skill, so treating an absent
 * model as the standard one is right.
 */
export function availableSkills(
  dlcIds: string[],
  model?: string | null,
): MinionSkill[] {
  const activeModel = model || "Minion";
  return MinionSkills.filter((skill) => {
    if ((skill.model || "Minion") !== activeModel) {
      return false;
    }
    return skill.requiredDlcIds.every((id) => dlcIds.indexOf(id) !== -1);
  });
}

import { TFunction } from "i18next";

/**
 * Skill groups - "interests" in game. Display strings are keyed by the exact
 * group id, matching the game's own STRINGS.DUPLICANTS.SKILLGROUPS table.
 *
 * "Management" has no entry there: the game dropped it from the table but
 * saves through 7.38 still store aptitudes against it, so it falls back to the
 * raw id rather than being hidden.
 */
export function skillGroupNameKey(groupId: string): string {
  return `oni:DUPLICANTS.SKILLGROUPS.${groupId}.NAME`;
}

export function skillGroupDescKey(groupId: string): string {
  return `oni:DUPLICANTS.SKILLGROUPS.${groupId}.DESC`;
}

/** The translated name, falling back to the raw id for unknown groups. */
export function skillGroupName(groupId: string, t: TFunction): string {
  return t(skillGroupNameKey(groupId), { defaultValue: groupId });
}

/**
 * Order interests the way they read on screen.
 *
 * As with traits, the ids do not match their labels - `MedicalAid` shows as
 * "Doctor", `Rocketry` as "Pilot", `Mining` as "Digger" - so sorting ids puts
 * entries under the wrong letter.
 */
export function sortSkillGroupsByName(
  groupIds: string[],
  t: TFunction,
  language?: string,
): string[] {
  const collator = new Intl.Collator(language, { sensitivity: "base" });
  return [...groupIds].sort((a, b) =>
    collator.compare(skillGroupName(a, t), skillGroupName(b, t)),
  );
}

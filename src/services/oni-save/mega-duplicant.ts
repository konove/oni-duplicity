import { AI_TRAITS, MinionSkillGroupNames } from "@konove/oni-save-parser";

export const MEGA_ATTRIBUTE_LEVEL = 9999;
export const MEGA_EXPERIENCE = 999999;

/**
 * The traits to give a duplicant that should be good at everything.
 *
 * "Every positive trait" is not a coherent set: three pairs the game flags
 * positive are also mutually exclusive - EarlyBird/NightOwl,
 * SimpleTastes/Foodie and Uncultured/InteriorDecorator. Adding both of a pair
 * would leave a duplicant the game considers invalid, so the first of each
 * pair in declaration order wins and its partner is skipped.
 *
 * Traits from packs the save does not have are left out, as are traits for a
 * different duplicant model, on the same reasoning as skills: writing one in
 * produces something the game will not honour.
 */
export function megaTraitIds(dlcIds: string[]): string[] {
  const chosen: string[] = [];

  for (const trait of AI_TRAITS) {
    if (!trait.positive) {
      continue;
    }

    const required = trait.requiredDlcIds || [];
    if (!required.every((id) => dlcIds.indexOf(id) !== -1)) {
      continue;
    }

    const conflicts = trait.mutuallyExclusive || [];
    if (conflicts.some((other) => chosen.indexOf(other) !== -1)) {
      continue;
    }

    chosen.push(trait.id);
  }

  return chosen;
}

/** Trait ids that are not part of the mega set, so should be stripped. */
export function isMegaTrait(traitId: string, megaIds: string[]): boolean {
  return megaIds.indexOf(traitId) !== -1;
}

/** Every interest. These have no exclusivity rules, so all of them apply. */
export function megaAptitudeIds(): string[] {
  return [...MinionSkillGroupNames];
}

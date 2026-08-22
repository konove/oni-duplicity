/**
 * Game object group names holding editable duplicants.
 *
 * The Bionic Booster Pack ships bionic duplicants as their own prefab
 * (`BionicMinionConfig`), so they form a group of their own rather than
 * appearing among the standard `Minion` objects. `MinionIdentity.model` is the
 * per-object discriminator, but the group name is what the editor lists by.
 *
 * Unverified: no save on hand contains a bionic duplicant, so "BionicMinion"
 * is taken from the game assembly rather than from real save data. Listing a
 * group that never exists is harmless - it simply matches nothing.
 */
export const DUPLICANT_GAMEOBJECT_TYPES = ["Minion", "BionicMinion"];

export function isDuplicantType(
  gameObjectType: string | null | undefined,
): boolean {
  return (
    gameObjectType != null &&
    DUPLICANT_GAMEOBJECT_TYPES.indexOf(gameObjectType) !== -1
  );
}

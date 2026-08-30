import { GameObjectBehavior, BehaviorName } from "oni-save-parser";

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

/**
 * Whether a duplicant is alive is not stored anywhere obvious.
 *
 * `HealthBehavior` looks like the place - the parser types it as carrying
 * `State: HealthState`, whose enum includes `Dead` - but that field is not in
 * the save. The `Health` type template declares exactly one field,
 * `canBeIncapacitated`, and it reads `true` on a dead duplicant and a living
 * one alike (checked on save versions 7.28 and 7.38).
 *
 * What actually changes is `FactionAlignment`: a dead duplicant drops out of
 * the colony's faction. In a save where one duplicant had suffocated it was
 * the only field that differed anywhere across his 54 behaviors - same
 * behavior set as the living ones, no `DeathMonitor` attached, empty
 * `serializedTags`, full hit points and full immunity.
 *
 * Living duplicants keep the flag wherever they are: all 21 in a Spaced Out
 * save read `true`, including four living on a second asteroid. A duplicant in
 * a rocket mid-flight is the one case still unchecked. See ROADMAP 1.1.
 */
export interface FactionAlignmentBehavior extends GameObjectBehavior {
  name: "FactionAlignment";
  templateData: {
    alignmentActive: boolean;
    targeted: boolean;
    targetable: boolean;
  };
}

export const FactionAlignmentBehavior =
  "FactionAlignment" as BehaviorName<FactionAlignmentBehavior>;

/**
 * Only a positive `false` counts as dead. A save without the behavior, or one
 * whose shape we do not recognise, reads as alive - marking a living duplicant
 * dead is the worse mistake of the two.
 */
export function isDeadAlignment(
  templateData: FactionAlignmentBehavior["templateData"] | null | undefined,
): boolean {
  return templateData != null && templateData.alignmentActive === false;
}

/** The write that undoes it: back into the faction, and targetable again. */
export const REVIVE_ALIGNMENT = {
  alignmentActive: true,
  targetable: true,
};

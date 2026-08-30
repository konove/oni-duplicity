import {
  GameObjectBehavior,
  BehaviorName,
  AIAmountInstance,
} from "oni-save-parser";

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

/**
 * Back into the faction, and targetable again.
 *
 * This does NOT revive anybody, and the assembly says why. Death is a state
 * machine state: `DeathMonitor` (serializable, `Both_DEPRECATED`) sits in
 * `root.dead.ground` with a `death` parameter naming the cause, and its
 * `ApplyDeath()` is what drops the duplicant out of the assignment groups -
 * so this flag is a *consequence* of death, not the record of it.
 *
 * The state itself lives in `StateMachineController.extraRaw`, a blob written
 * by `StateMachineSerializer` outside the type-template system, which is why
 * the behavior's template declares no fields and why oni-save-parser keeps it
 * as opaque bytes. Reviving means editing that blob. See ROADMAP 1.1.
 */
export const REVIVE_ALIGNMENT = {
  alignmentActive: true,
  targetable: true,
};

/**
 * Amounts that kill a duplicant outright when they reach zero, and the value
 * the editor treats as full. Restoring them is part of a revive, but it is not
 * what brings anyone back - see `REVIVE_ALIGNMENT`.
 *
 * Nothing in the save records a maximum - these are the numbers the Health tab
 * already draws its sliders against, kept here so the two cannot drift. 100 is
 * what the game's own panel shows for breath and health, and it is the highest
 * value across the 25 duplicants in the saves on hand.
 *
 * Suffocation does not go through health: the duplicant who died of it was at
 * 100 hit points and 0 breath, which is why restoring health alone would not
 * have helped him.
 */
export const LETHAL_AT_ZERO: Record<string, number> = {
  HitPoints: 100,
  Breath: 100,
  Calories: 4000000,
};

/**
 * Tops up only what is actually lethal, so reviving someone who suffocated
 * does not also silently refill their stomach. An amount that is merely low is
 * left where it is - they were alive at that value a moment ago.
 */
export function reviveAmounts(amounts: AIAmountInstance[]): AIAmountInstance[] {
  return amounts.map((amount) => {
    const full = LETHAL_AT_ZERO[amount.name];
    if (full === undefined || amount.value.value > 0) {
      return amount;
    }
    return { ...amount, value: { ...amount.value, value: full } };
  });
}

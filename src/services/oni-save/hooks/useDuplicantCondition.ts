import * as React from "react";

import { MinionModifiersBehavior } from "oni-save-parser";

import {
  FactionAlignmentBehavior,
  StateMachineControllerBehavior,
  isDeadAlignment,
  REVIVE_ALIGNMENT,
  reviveAmounts,
} from "../duplicants";
import {
  decodeStateMachines,
  findDeathMonitor,
  isDeadStateMachines,
  reviveStateMachines,
} from "../state-machines";

import useBehavior from "./useBehavior";

export interface UseDuplicantCondition {
  isDead: boolean;
  revive(): void;
}

/**
 * Whether this duplicant is dead, and everything that undoes it.
 *
 * Death is a `DeathMonitor` state inside `StateMachineController`'s hand-rolled
 * blob - see `state-machines.ts` - so that is what gets read and written.
 *
 * The faction flag is only consulted when the blob is not there to ask. The
 * bundled example save is JSON, and an ArrayBuffer does not survive a trip
 * through JSON, so its duplicants carry no state machines at all.
 */
export default function useDuplicantCondition(
  gameObjectId: number,
): UseDuplicantCondition {
  const { templateData: alignment, onTemplateDataModify: modifyAlignment } =
    useBehavior(gameObjectId, FactionAlignmentBehavior);
  const { extraRaw: stateMachines, onExtraRawModify: modifyStateMachines } =
    useBehavior(gameObjectId, StateMachineControllerBehavior);
  const { extraData: modifiers, onExtraDataModify: modifyModifiers } =
    useBehavior(gameObjectId, MinionModifiersBehavior);

  const machines = decodeStateMachines(stateMachines);
  const isDead =
    machines && findDeathMonitor(machines)
      ? isDeadStateMachines(stateMachines)
      : isDeadAlignment(alignment);

  const revive = React.useCallback(() => {
    // The one that actually resurrects anybody.
    const revived = reviveStateMachines(stateMachines);
    if (revived) {
      modifyStateMachines(revived);
    }

    // And the two the game recomputes from it anyway, so the editor is not
    // left showing something the game will disagree with a tick later.
    modifyAlignment(REVIVE_ALIGNMENT);
    if (modifiers && modifiers.amounts) {
      modifyModifiers({
        amounts: reviveAmounts(modifiers.amounts),
        // Shallow-assigned rather than deep-merged, so this really does empty
        // the list - a revived duplicant should not still be carrying the
        // disease that killed them.
        sicknesses: [],
      });
    }
  }, [
    stateMachines,
    modifyStateMachines,
    modifyAlignment,
    modifyModifiers,
    modifiers,
  ]);

  return { isDead, revive };
}

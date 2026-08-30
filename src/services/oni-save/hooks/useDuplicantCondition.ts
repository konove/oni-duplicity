import * as React from "react";

import { MinionModifiersBehavior } from "oni-save-parser";

import {
  FactionAlignmentBehavior,
  isDeadAlignment,
  REVIVE_ALIGNMENT,
  reviveAmounts,
} from "../duplicants";

import useBehavior from "./useBehavior";

export interface UseDuplicantCondition {
  isDead: boolean;
  revive(): void;
}

/**
 * Whether this duplicant is dead, and the one write that undoes it.
 *
 * Everything that marks a dead duplicant on screen reads it from here, so the
 * reasoning behind `FactionAlignment` (see `duplicants.ts`) lives in one place
 * rather than in every component that wants to grey a portrait.
 */
export default function useDuplicantCondition(
  gameObjectId: number,
): UseDuplicantCondition {
  const { templateData, onTemplateDataModify } = useBehavior(
    gameObjectId,
    FactionAlignmentBehavior,
  );
  const { extraData: modifiers, onExtraDataModify } = useBehavior(
    gameObjectId,
    MinionModifiersBehavior,
  );

  // Neither of these writes actually resurrects anyone: the game holds death as
  // a DeathMonitor state inside StateMachineController's raw blob, which the
  // parser preserves but does not decode. Tidying the flag and the vitals is
  // the half that can be written today. ROADMAP 1.1 has the rest.
  const revive = React.useCallback(() => {
    onTemplateDataModify(REVIVE_ALIGNMENT);
    if (modifiers && modifiers.amounts) {
      onExtraDataModify({
        amounts: reviveAmounts(modifiers.amounts),
        // Shallow-assigned rather than deep-merged, so this really does empty
        // the list - a revived duplicant should not be carrying the disease
        // that killed them.
        sicknesses: [],
      });
    }
  }, [onTemplateDataModify, onExtraDataModify, modifiers]);

  return { isDead: isDeadAlignment(templateData), revive };
}

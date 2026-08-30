import * as React from "react";

import {
  FactionAlignmentBehavior,
  isDeadAlignment,
  REVIVE_ALIGNMENT,
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

  const revive = React.useCallback(() => {
    onTemplateDataModify(REVIVE_ALIGNMENT);
  }, [onTemplateDataModify]);

  return { isDead: isDeadAlignment(templateData), revive };
}

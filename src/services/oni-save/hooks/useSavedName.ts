import { UserNameableBehavior, savedNameOf } from "../user-nameable";

import useBehavior from "./useBehavior";

/**
 * The name the game stored for an object, or null when it has none, so the
 * caller can fall back to the type name.
 */
export default function useSavedName(gameObjectId: number): string | null {
  const { templateData } = useBehavior<UserNameableBehavior>(
    gameObjectId,
    UserNameableBehavior,
  );
  return savedNameOf(templateData?.savedName);
}

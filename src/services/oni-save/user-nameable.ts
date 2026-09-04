import { GameObjectBehavior, BehaviorName } from "@konove/oni-save-parser";

/**
 * The name the game gave an object, or the player did.
 *
 * Geysers get one at world generation - "Copper Volcano FP34‑1", code and all,
 * which is the name the game's own panels print - and buildings get their
 * display name as rich text. Duplicants are named through `MinionIdentity`
 * instead and do not carry this.
 */
export const UserNameableBehavior: BehaviorName<UserNameableBehavior> =
  "UserNameable";

export interface UserNameableBehavior extends GameObjectBehavior {
  name: "UserNameable";
  templateData: {
    savedName: string;
  };
}

// The game's string markup: <link="STORAGELOCKER">, <color=#ff0000>, </b>...
const MARKUP = /<\/?[a-z]+(?:=[^>]*)?>/gi;

/**
 * The saved name as a reader should see it: markup stripped, whitespace
 * trimmed, and null rather than an empty string when there is nothing left.
 */
export function savedNameOf(savedName: string | undefined): string | null {
  const name = (savedName ?? "").replace(MARKUP, "").trim();
  return name.length > 0 ? name : null;
}

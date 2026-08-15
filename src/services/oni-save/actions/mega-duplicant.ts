import { UnknownAction } from "redux";

export const ACTION_ONISAVE_MEGA_DUPLICANT = "oni-save/mega-duplicant";
export const megaDuplicant = (gameObjectId: number) => ({
  type: ACTION_ONISAVE_MEGA_DUPLICANT as typeof ACTION_ONISAVE_MEGA_DUPLICANT,
  payload: { gameObjectId },
});
export type MegaDuplicantAction = ReturnType<typeof megaDuplicant>;

export function isMegaDuplicantAction(
  action: UnknownAction,
): action is MegaDuplicantAction {
  return action.type === ACTION_ONISAVE_MEGA_DUPLICANT;
}
